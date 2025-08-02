### backend/app/api/matches.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..schemas import GameSimpleResultUpdate
from ..models import Game, Match, Round, Player, Tournament, Tiebreaker
from ..database import get_db
from ..schemas import MatchResponse, GameSimpleResultUpdate, MatchRescheduleRequest, SwapPlayersRequest, MatchSwapRequest, ColorSwapRequest
from ..auth_utils import get_current_user
from .. import crud
from ..tournament_logic import recalculate_tournament_stats

router = APIRouter(prefix="/api/matches", tags=["matches"])

@router.get("/{tournament_id}/{round_number}", response_model=List[MatchResponse])
def get_matches(tournament_id: int, round_number: int, db: Session = Depends(get_db)):
    """Get all matches for a specific round in a specific tournament."""
    # First get the round ID for this tournament and round number
    round_obj = db.query(Round).filter(
        Round.tournament_id == tournament_id,
        Round.round_number == round_number
    ).first()
    
    if not round_obj:
        raise HTTPException(
            status_code=404, 
            detail=f"Round {round_number} not found for tournament {tournament_id}"
        )
    
    return crud.get_matches(db, round_id=round_obj.id)

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

    # Allow changing results anytime - no completion check

    # 🧮 Convert result string to scores
    if update.result == "white_win":
        game.white_score = 1.0
        game.black_score = 0.0
        game.result = update.result
        game.is_completed = True
    elif update.result == "black_win":
        game.white_score = 0.0
        game.black_score = 1.0
        game.result = update.result
        game.is_completed = True
    elif update.result == "draw":
        game.white_score = 0.5
        game.black_score = 0.5
        game.result = update.result
        game.is_completed = True
    elif update.result == "pending":
        # Reset game to pending state
        game.white_score = 0.0
        game.black_score = 0.0
        game.result = None
        game.is_completed = False
    else:
        raise HTTPException(status_code=400, detail=f"Invalid result: {update.result}")
    
    db.commit()

    # 🔄 Recalculate all tournament statistics after result change
    match = db.query(Match).filter(Match.id == match_id).first()
    if match:
        recalculate_tournament_stats(db, match.tournament_id)

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
    
    # Removed completion checks to allow swaps anytime
    # if game.is_completed:
    #     raise HTTPException(status_code=400, detail="Cannot swap players after result is submitted.")

    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    # Removed match completion check
    # if match.is_completed:
    #     raise HTTPException(status_code=400, detail="Match not found or already completed")

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

    # Keep the existing game result - don't reset it
    # The result represents what happened in this game position/board
    # regardless of which specific players are currently assigned

    db.commit()
    
    # 🔄 Recalculate all tournament statistics after player swap
    recalculate_tournament_stats(db, match.tournament_id)

    return {"message": "Players swapped successfully, result preserved"}

@router.post("/{match_id}/swap-players")
def swap_match_players(
    match_id: int,
    swap_data: MatchSwapRequest,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user)
):
    """Swap players at the match level - can swap board positions and substitute players"""
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    # Get all games for this match
    games = db.query(Game).filter(Game.match_id == match_id).order_by(Game.board_number).all()
    if not games:
        raise HTTPException(status_code=400, detail="No games found for this match")
    
    # Process white team swaps
    for swap in swap_data.white_team_swaps:
        player1 = db.query(Player).filter(Player.id == swap.player1_id).first()
        player2 = db.query(Player).filter(Player.id == swap.player2_id).first()
        
        if not player1 or not player2:
            raise HTTPException(status_code=400, detail="One or both players not found")
        
        if player1.team_id != match.white_team_id or player2.team_id != match.white_team_id:
            raise HTTPException(status_code=400, detail="Players must be from the white team")
        
        # Find games where these players are currently assigned
        game1 = None
        game2 = None
        for game in games:
            if game.white_player_id == player1.id:
                game1 = game
            elif game.white_player_id == player2.id:
                game2 = game
        
        # Perform the swap based on what positions they're in
        if game1 and game2:
            # Both playing - swap board positions
            game1.white_player_id = player2.id
            game2.white_player_id = player1.id
        elif game1 and not game2:
            # Player1 playing, Player2 substitute - substitute them
            game1.white_player_id = player2.id
        elif not game1 and game2:
            # Player1 substitute, Player2 playing - substitute them
            game2.white_player_id = player1.id
        # If neither playing (both substitutes), ignore this swap
    
    # Process black team swaps
    for swap in swap_data.black_team_swaps:
        player1 = db.query(Player).filter(Player.id == swap.player1_id).first()
        player2 = db.query(Player).filter(Player.id == swap.player2_id).first()
        
        if not player1 or not player2:
            raise HTTPException(status_code=400, detail="One or both players not found")
        
        if player1.team_id != match.black_team_id or player2.team_id != match.black_team_id:
            raise HTTPException(status_code=400, detail="Players must be from the black team")
        
        # Find games where these players are currently assigned
        game1 = None
        game2 = None
        for game in games:
            if game.black_player_id == player1.id:
                game1 = game
            elif game.black_player_id == player2.id:
                game2 = game
        
        # Perform the swap based on what positions they're in
        if game1 and game2:
            # Both playing - swap board positions
            game1.black_player_id = player2.id
            game2.black_player_id = player1.id
        elif game1 and not game2:
            # Player1 playing, Player2 substitute - substitute them
            game1.black_player_id = player2.id
        elif not game1 and game2:
            # Player1 substitute, Player2 playing - substitute them
            game2.black_player_id = player1.id
        # If neither playing (both substitutes), ignore this swap
    
    db.commit()
    
    # 🔄 Recalculate all tournament statistics after player swap
    recalculate_tournament_stats(db, match.tournament_id)

    return {"message": "Match players swapped successfully, results preserved"}

@router.post("/{match_id}/swap-colors")
def swap_match_colors(
    match_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user)
):
    """Swap team colors for knockout matches - all white team players become black, and vice versa"""
    from ..tournament_logic import recalculate_tournament_stats
    
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    # Get tournament to check if it's in knockout stage
    tournament = db.query(Tournament).filter(Tournament.id == match.tournament_id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    # Check if this is a knockout stage match
    from ..tournament_logic import is_knockout_stage
    if not is_knockout_stage(tournament, match.round_number):
        raise HTTPException(status_code=400, detail="Color swap is only allowed for knockout stage matches")
    
    # Get all games for this match
    games = db.query(Game).filter(Game.match_id == match_id).order_by(Game.board_number).all()
    if not games:
        raise HTTPException(status_code=400, detail="No games found for this match")
    
    # Swap the team colors at match level
    original_white_team_id = match.white_team_id
    original_black_team_id = match.black_team_id
    
    match.white_team_id = original_black_team_id
    match.black_team_id = original_white_team_id
    
    # Swap the player colors for all games and preserve results
    for game in games:
        original_white_player_id = game.white_player_id
        original_black_player_id = game.black_player_id
        
        game.white_player_id = original_black_player_id
        game.black_player_id = original_white_player_id
        
        # Swap game results if they exist
        if game.result:
            if game.result == "white_win":
                game.result = "black_win"
            elif game.result == "black_win":
                game.result = "white_win"
            # Draw stays the same
        
        # Swap scores too
        original_white_score = game.white_score
        original_black_score = game.black_score
        game.white_score = original_black_score
        game.black_score = original_white_score
    
    # Swap match level results and scores
    if match.result:
        if match.result == "white_win":
            match.result = "black_win"
        elif match.result == "black_win":
            match.result = "white_win"
        # Draw stays the same
    
    original_white_score = match.white_score
    original_black_score = match.black_score
    match.white_score = original_black_score
    match.black_score = original_white_score
    
    # Handle tiebreaker if it exists
    tiebreaker = db.query(Tiebreaker).filter(Tiebreaker.match_id == match_id).first()
    if tiebreaker:
        # Swap tiebreaker team assignments
        original_white_team = tiebreaker.white_team_id
        original_black_team = tiebreaker.black_team_id
        
        tiebreaker.white_team_id = original_black_team
        tiebreaker.black_team_id = original_white_team
        
        # Update winner team ID if tiebreaker is completed
        if tiebreaker.is_completed and tiebreaker.winner_team_id:
            # No need to change winner_team_id as it still points to the same team
            # that won, just now they have a different color
            pass
    
    db.commit()
    
    # Recalculate tournament statistics after color swap
    recalculate_tournament_stats(db, match.tournament_id)

    return {"message": "Team colors swapped successfully", "match_id": match_id}
