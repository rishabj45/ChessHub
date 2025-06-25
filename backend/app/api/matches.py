### backend/app/api/matches.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..schemas import GameSimpleResultUpdate
from ..models import Game, Match , Round , Player
from ..database import get_db
from ..schemas import MatchResponse , GameSimpleResultUpdate , MatchRescheduleRequest ,SwapPlayersRequest
from ..auth_utils import get_current_user
from .. import crud

router = APIRouter(prefix="/api/matches", tags=["matches"])

@router.get("/{round_id}", response_model=List[MatchResponse])
def get_matches(round_id: int, db: Session = Depends(get_db)):
    """Get all matches for a round."""
    return crud.get_matches(db, round_id=round_id)

@router.post("/{match_id}/board/{board_number}/result")
def submit_board_result(
    match_id: int,
    board_number: int,
    update: GameSimpleResultUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user)
):
    game = (
        db.query(Game)
        .filter(Game.match_id == match_id, Game.board_number == board_number)
        .first()
    )
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    # 🧮 Convert result string to scores
    if update.result == "white_win":
        game.white_score = 1.0
        game.black_score = 0.0
    elif update.result == "black_win":
        game.white_score = 0.0
        game.black_score = 1.0
    else:  # draw
        game.white_score = 0.5
        game.black_score = 0.5
    game.result = update.result
    game.is_completed = True
    db.commit()

    # 🎯 Check match status
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    match.white_score = sum(g.white_score for g in match.games)
    match.black_score = sum(g.black_score for g in match.games)
    if all(g.is_completed for g in match.games):
        if match.white_score > match.black_score:
            match.result = "white_win"
        elif match.black_score > match.white_score:
            match.result = "black_win"
        else:
            match.result = "draw"

        match.is_completed = True
    db.commit()
    round_matches = db.query(Match).filter(Match.round_id == match.round_id).all()
    if all(m.is_completed for m in round_matches):
        match.round.is_completed = True
        db.commit()
        completed = db.query(Round).filter(
            Round.tournament_id == match.tournament_id,
            Round.is_completed == True
        ).count()
        tournament = crud.get_tournament(db, match.tournament_id)
        if tournament:
            tournament.current_round = completed + 1
            db.commit()

    return {"message": f"Game result '{update.result}' submitted successfully"}

@router.post("/rounds/{round_number}/reschedule")
def reschedule_round(
    round_number: int,
    req: MatchRescheduleRequest,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user)
):
    matches = db.query(Match).filter(Match.round_number == round_number).all()
    if not matches:
        raise HTTPException(404, "No matches in round")
    for m in matches:
        m.scheduled_date = req.scheduled_date
    db.commit()
    return {"message": "Rescheduled"}

# Backend API endpoints needed


@router.get("/{match_id}/available-swaps")
def get_available_swaps(
    match_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user)
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    white_team_players = db.query(Player).filter(Player.team_id == match.white_team_id).order_by(Player.position).all()
    black_team_players = db.query(Player).filter(Player.team_id == match.black_team_id).order_by(Player.position).all()

    # Current assignments per board
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
            {"id": p.id, "name": p.name, "position": p.position} for p in white_team_players
        ],
        "black_team_players": [
            {"id": p.id, "name": p.name, "position": p.position} for p in black_team_players
        ],
        "current_assignments": current_assignments
    }

@router.post("/{match_id}/games/{game_id}/swap-players")
def swap_players(
    match_id: int,
    game_id: int,
    swap_data: SwapPlayersRequest,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user)
):
    game = db.query(Game).filter(Game.id == game_id, Game.match_id == match_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    if game.is_completed:
        raise HTTPException(status_code=400, detail="Cannot swap players after result is submitted.")

    match = db.query(Match).filter(Match.id == match_id).first()
    if not match or match.is_completed:
        raise HTTPException(status_code=400, detail="Match not found or already completed")

    if swap_data.new_white_player_id:
        player = db.query(Player).filter(Player.id == swap_data.new_white_player_id).first()
        if not player or player.team_id != match.white_team_id:
            raise HTTPException(status_code=400, detail="Invalid white player for this match")
        game.white_player_id = player.id

    if swap_data.new_black_player_id:
        player = db.query(Player).filter(Player.id == swap_data.new_black_player_id).first()
        if not player or player.team_id != match.black_team_id:
            raise HTTPException(status_code=400, detail="Invalid black player for this match")
        game.black_player_id = player.id


    db.commit()
    return {"message": "Players swapped successfully"}
