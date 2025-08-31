### backend/app/api/matches.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..models import Game, Match, Round, Player
from ..database import get_db
from ..schemas import MatchResponse, SwapPlayersRequest , ResultUpdate
from ..utilities.auth import get_current_user
from .. import crud
from ..utilities.tournament import recalculate_round_stats
from ..enums import MatchResult ,MatchLabel ,Tiebreaker

router = APIRouter(prefix="/api/matches", tags=["matches"])

@router.get("/{tournament_id}/{round_number}", response_model=List[MatchResponse])
def get_matches(tournament_id: int, round_number: int, db: Session = Depends(get_db)):
    round_obj = db.query(Round).filter(
        Round.tournament_id == tournament_id,
        Round.round_number == round_number
    ).first()
    
    if not round_obj:
        raise HTTPException(
            status_code=404, 
            detail=f"Round {round_number} not found for tournament {tournament_id}"
        )
    
    return crud.get_matches(db,round_number,tournament_id)

@router.post("/{match_id}/result")
def submit_board_result(
    match_id: int,
    board_number: int,
    update: ResultUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user)
):
    match = db.query(Match).filter(Match.id == match_id).first()
    game = (
        db.query(Game)
        .filter(Game.match_id == match_id, Game.board_number == board_number)
        .first()
    )
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    if update.result == MatchResult.white_win:
        game.white_score = 1.0
        game.black_score = 0.0
        game.result = update.result
        game.is_completed = True
    elif update.result == MatchResult.black_win:
        game.white_score = 0.0
        game.black_score = 1.0
        game.result = update.result
        game.is_completed = True
    elif update.result == MatchResult.draw:
        game.white_score = 0.5
        game.black_score = 0.5
        game.result = update.result
        game.is_completed = True
    elif update.result == MatchResult.pending:
        game.white_score = 0.0
        game.black_score = 0.0
        game.result = update.result
        game.is_completed = False
    else:
        raise HTTPException(status_code=400, detail=f"Invalid result: {update.result}")
    
    db.commit()

    recalculate_round_stats(db, match.tournament_id, match.round_number)

    return {"message": f"Game result '{update.result}' submitted successfully"}

@router.post("/{match_id}/tiebreaker")
def submit_tiebreaker_result(
    match_id: int,
    update: ResultUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user)
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    if match.tiebreaker == Tiebreaker.no_tiebreaker:
        raise HTTPException(status_code=400, detail="This match has no tiebreaker")

    if update.result not in (MatchResult.white_win, MatchResult.black_win,MatchResult.tiebreaker):
        raise HTTPException(status_code=400, detail="Tiebreaker must be white_win or black_win or pending")

    match.tiebreaker = update.result
    db.commit()

    recalculate_round_stats(db, match.tournament_id, match.round_number)

    return {
        "message": "Tiebreaker result recorded",
        "match_id": match_id,
        "tiebreaker_result": update.result
    }

@router.get("/{match_id}/available-swaps")
def get_available_swaps(
    match_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user)
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    white_team_players = db.query(Player).filter(Player.team_id == match.white_team_id).order_by(Player.id).all()
    black_team_players = db.query(Player).filter(Player.team_id == match.black_team_id).order_by(Player.id).all()

    current_assignments = []
    for game in match.games:
        current_assignments.append({
            "game_id": game.id,
            "board_number": game.board_number,
            "white_player_id": game.white_player_id,
            "black_player_id": game.black_player_id
        })

    return {
        "white_team_players": [
            {"id": p.id, "name": p.name} for p in white_team_players
        ],
        "black_team_players": [
            {"id": p.id, "name": p.name} for p in black_team_players
        ],
        "current_assignments": current_assignments
    }

@router.post("/{match_id}/swap-players")
def swap_players(
    match_id: int,
    data: SwapPlayersRequest,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user)
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    p1 = db.query(Player).filter(Player.id == data.player1_id).first()
    p2 = db.query(Player).filter(Player.id == data.player2_id).first()
    if not p1 or not p2:
        raise HTTPException(status_code=400, detail="One or both players not found")
    if p1==p2:
        raise HTTPException(status_code=400, detail="Both players are same")
    same_white = p1.team_id == match.white_team_id and p2.team_id == match.white_team_id
    same_black = p1.team_id == match.black_team_id and p2.team_id == match.black_team_id
    if not (same_white or same_black):
        raise HTTPException(status_code=400, detail="Players must belong to the same team  of the match")

    games = db.query(Game).filter(Game.match_id == match_id).order_by(Game.id).all()

    game_p1 = None
    game_p2 = None
    for g in games:
        player_id = g.white_player_id if same_white else g.black_player_id
        if player_id == p1.id:
            if game_p1:
                raise HTTPException(status_code=409, detail="Player1 appears multiple times (data inconsistency)")
            game_p1 = g
        elif player_id == p2.id:
            if game_p2:
                raise HTTPException(status_code=409, detail="Player2 appears multiple times (data inconsistency)")
            game_p2 = g

    if game_p1:
        if same_white:
            game_p1.white_player_id= p2.id
        else:
            game_p1.black_player_id = p2.id

    if game_p2:
        if same_white:
            game_p2.white_player_id = p1.id
        else:
            game_p2.black_player_id = p1.id
    if not game_p1 and not game_p2:
        return 

    db.commit()
    recalculate_round_stats(db, match.tournament_id, match.round_number)

@router.post("/{match_id}/swap-colors")
def swap_match_colors(
    match_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user)
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    if match.label==MatchLabel.group:
        raise HTTPException(status_code=404, detail="can only swap for knockout matches")

    games = db.query(Game).filter(Game.match_id == match_id).order_by(Game.board_number).all()
    if not games:
        raise HTTPException(status_code=400, detail="No games found for this match")

    match.white_team_id, match.black_team_id = match.black_team_id, match.white_team_id

    for game in games:
        game.white_player_id, game.black_player_id = game.black_player_id, game.white_player_id

    db.commit()
    recalculate_round_stats(db, match.tournament_id, match.round_number)

    return {"message": "Team colors swapped successfully", "match_id": match_id}
