### backend/app/api/tournaments.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..auth_utils import get_current_user
from ..schemas import TournamentResponse, TournamentCreate, TournamentUpdate, StandingsResponse, BestPlayersResponse
from .. import crud
from .. import tournament_logic 
router = APIRouter(prefix="/api/tournaments", tags=["tournaments"])

@router.get("/current", response_model=Optional[TournamentResponse])
def get_current_tournament(db: Session = Depends(get_db)):
    """Get the current (latest) tournament."""
    tour = crud.get_current_tournament(db)
    return tour

@router.get("/{tournament_id}", response_model=TournamentResponse)
def get_tournament(tournament_id: int, db: Session = Depends(get_db)):
    tour = crud.get_tournament(db, tournament_id)
    if not tour:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tournament not found")
    return tour

@router.get("/", response_model=List[TournamentResponse])
def list_tournaments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_tournaments(db, skip=skip, limit=limit)

@router.post("/", response_model=TournamentResponse)
def create_tournament(tournament: TournamentCreate, db: Session = Depends(get_db),
                      _: dict = Depends(get_current_user)):
    """Create a new tournament (admin only)."""
    new_tour = crud.create_tournament(db, tournament)
    return new_tour

@router.put("/{tournament_id}", response_model=TournamentResponse)
def update_tournament(tournament_id: int, tour_upd: TournamentUpdate, db: Session = Depends(get_db),
                      _: dict = Depends(get_current_user)):
    updated = crud.update_tournament(db, tournament_id, tour_upd)
    if not updated:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tournament not found")
    return updated

@router.delete("/{tournament_id}")
def delete_tournament(tournament_id: int, db: Session = Depends(get_db),
                      _: dict = Depends(get_current_user)):
    success = crud.delete_tournament(db, tournament_id)
    if not success:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tournament not found")
    return {"message": "Tournament deleted successfully"}

@router.get("/{tournament_id}/standings", response_model=StandingsResponse)
def get_standings(tournament_id: int, db: Session = Depends(get_db)):
    tour = crud.get_tournament(db, tournament_id)
    if not tour:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tournament not found")
    standings = tournament_logic.calculate_standings(db, tournament_id)
    return StandingsResponse(standings=standings)

@router.get("/{tournament_id}/best-players", response_model=BestPlayersResponse)
def get_best_players(tournament_id: int, db: Session = Depends(get_db)):
    tour = crud.get_tournament(db, tournament_id)
    if not tour:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tournament not found")
    stats = crud.get_best_players(db, tournament_id)
    return BestPlayersResponse(
        tournament_id=tournament_id,
        tournament_name=tour.name,
        players=stats
    )
