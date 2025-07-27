### backend/app/api/players.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional

from ..database import get_db
from ..models import Game
from ..schemas import PlayerResponse, PlayerCreate, PlayerUpdate, BestPlayersResponse
from ..auth_utils import get_current_user
from .. import crud

router = APIRouter(prefix="/api/players", tags=["players"])

@router.get("", response_model=List[PlayerResponse])
def list_players(team_id: Optional[int] = None, tournament_id: Optional[int] = None,
                 db: Session = Depends(get_db)):
    """Get all players, optionally filtered."""
    return crud.get_players(db, team_id=team_id, tournament_id=tournament_id)

@router.get("/{player_id}", response_model=PlayerResponse)
def get_player(player_id: int, db: Session = Depends(get_db)):
    player = crud.get_player(db, player_id)
    if not player:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Player not found")
    return player

@router.post("", response_model=PlayerResponse)
def create_player(player: PlayerCreate, db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    """Create a new player (admin only)."""
    team = crud.get_team(db, player.team_id)
    if not team:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Team not found")
    if team.tournament.stage == "completed":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot add player to completed tournament")
    if team.tournament.stage and team.tournament.stage != "not_yet_started":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot add player after tournament has started")
    if crud.get_player_by_name_in_team(db, player.name, player.team_id):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Player name already exists in this team")
    if not player.position:
        player.position = len(team.players) + 1
    return crud.create_player(db, player)

@router.put("/{player_id}", response_model=PlayerResponse)
def update_player(player_id: int, upd: PlayerUpdate, db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    """Update player details (admin only)."""
    p = crud.get_player(db, player_id)
    if not p:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Player not found")
    if p.team.tournament.stage == "completed":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot update player in completed tournament")
    if p.team.tournament.stage and p.team.tournament.stage != "not_yet_started":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot update player after tournament has started")
    if upd.name and upd.name != p.name:
        if crud.get_player_by_name_in_team(db, upd.name, p.team_id):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Player name already exists")
    if upd.position:
        size = len(p.team.players)
        if not (1 <= upd.position <= size):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Position must be between 1 and {size}")
    return crud.update_player(db, player_id, upd)

@router.delete("/{player_id}")
def delete_player(player_id: int, db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    """Delete a player (admin only)."""
    p = crud.get_player(db, player_id)
    if not p:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Player not found")
    if p.team.tournament.stage == "completed":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot delete player from completed tournament")
    if p.team.tournament.stage and p.team.tournament.stage != "not_yet_started":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot delete player after tournament has started")
    if len(p.team.players) <= 4:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Team must have at least 4 players")
    
    # Check if player is assigned to any games
    games_count = db.query(Game).filter(
        or_(Game.white_player_id == player_id, Game.black_player_id == player_id)
    ).count()
    
    if games_count > 0:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, 
            f"Cannot delete player - assigned to {games_count} game(s). Use player swap to reassign first."
        )
    
    team_id, old_pos = p.team_id, p.position
    success = crud.delete_player(db, player_id)
    if not success:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Player not found")
    crud.adjust_player_positions_after_deletion(db, team_id, old_pos)
    return {"message": "Player deleted successfully"}

@router.get("/{player_id}/games")
def get_player_games(player_id: int, db: Session = Depends(get_db)):
    """Get all games played by a player."""
    p = crud.get_player(db, player_id)
    if not p:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Player not found")
    return {
        "player_id": player_id,
        "player_name": p.name,
        "team_name": p.team.name,
        "games": crud.get_player_games(db, player_id)
    }

@router.get("/{player_id}/statistics")
def get_player_statistics(player_id: int, db: Session = Depends(get_db)):
    """Get detailed statistics for a player."""
    p = crud.get_player(db, player_id)
    if not p:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Player not found")
    total = p.wins + p.draws + p.losses
    win_pct = ((p.wins + 0.5 * p.draws) / total * 100) if total else 0
    perf = p.rating + ((p.wins + 0.5 * p.draws) / total - 0.5) * 400 if total else p.rating
    return {
        "player_id": player_id,
        "name": p.name,
        "team_name": p.team.name,
        "rating": p.rating,
        "position": p.position,
        "games_played": total,
        "wins": p.wins,
        "draws": p.draws,
        "losses": p.losses,
        "win_percentage": round(win_pct, 2),
        "performance_rating": round(perf, 0),
        "points": p.wins + 0.5 * p.draws,
    }
