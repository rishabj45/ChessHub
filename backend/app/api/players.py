### backend/app/api/players.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from ..database import get_db
from ..models import Game
from ..schemas import PlayerResponse, PlayerCreate, PlayerUpdate
from ..utilities.auth import get_current_user
from .. import crud

router = APIRouter(prefix="/api/players", tags=["players"])

@router.get("", response_model=List[PlayerResponse])
def list_players(team_id: Optional[int] = None, tournament_id: Optional[int] = None,
                 db: Session = Depends(get_db)):
    return crud.get_players(db, team_id=team_id, tournament_id=tournament_id)

@router.get("/{player_id}", response_model=PlayerResponse)
def get_player(player_id: int, db: Session = Depends(get_db)):
    player = crud.get_player(db, player_id)
    if not player:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Player not found")
    return player

@router.post("", response_model=PlayerResponse)
def create_player(player: PlayerCreate, db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    try:
        created = crud.create_player(db, player)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    return created

@router.put("/{player_id}", response_model=PlayerResponse)
def update_player(player_id: int, player_upd: PlayerUpdate, db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    try:
        updated = crud.update_player(db, player_id, player_upd)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    if not updated:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Player not found")
    return updated

@router.delete("/{player_id}")
def delete_player(player_id: int, db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    p = crud.get_player(db, player_id)
    if not p:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Player not found")
    if len(p.team.players) <= 4:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Team must have at least 4 players")
    games_count = db.query(Game).filter(
        or_(Game.white_player_id == player_id, Game.black_player_id == player_id)
    ).count()
    if games_count > 0:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, 
            f"Cannot delete player - assigned to {games_count} game(s). Use player swap to reassign first."
        )
    success = crud.delete_player(db, player_id)
    if not success:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Player not found")
    return {"message": "Player deleted successfully"}