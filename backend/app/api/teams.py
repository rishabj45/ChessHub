### backend/app/api/teams.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..utilities.auth import get_current_user
from ..schemas import TeamResponse,TeamUpdate
from .. import crud

router = APIRouter(prefix="/api/teams", tags=["teams"])

@router.get("", response_model=List[TeamResponse])
def list_teams(tournament_id: int, db: Session = Depends(get_db)):
    return crud.get_teams(db, tournament_id)

@router.get("/{team_id}", response_model=TeamResponse)
def get_team(team_id: int, db: Session = Depends(get_db)):
    team = crud.get_team(db, team_id)
    if not team:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Team not found")
    return team

@router.put("/{team_id}", response_model=TeamResponse)
def update_team(team_id: int, team_upd: TeamUpdate, db: Session = Depends(get_db),
                _: dict = Depends(get_current_user)):  
    try:
        updated = crud.update_team(db, team_id, team_upd)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    if not updated:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Team not found")
    return updated


