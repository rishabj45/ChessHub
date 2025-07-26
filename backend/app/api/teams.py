### backend/app/api/teams.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..auth_utils import get_current_user
from ..schemas import TeamResponse, TeamCreate, TeamUpdate
from .. import crud

router = APIRouter(prefix="/api/teams", tags=["teams"])

@router.get("", response_model=List[TeamResponse])
def list_teams(tournament_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Get all teams, optionally filtered by tournament."""
    return crud.get_teams(db, tournament_id)

@router.get("/{team_id}", response_model=TeamResponse)
def get_team(team_id: int, db: Session = Depends(get_db)):
    team = crud.get_team(db, team_id)
    if not team:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Team not found")
    return team

@router.post("/", response_model=TeamResponse)
def create_team(team: TeamCreate, db: Session = Depends(get_db), admin_user: dict = Depends(get_current_user)):
    """Create a new team (admin only)."""
    new_team = crud.create_team(db, team)
    return new_team

@router.put("/{team_id}", response_model=TeamResponse)
def update_team(team_id: int, team_upd: TeamUpdate, db: Session = Depends(get_db),
                admin_user: dict = Depends(get_current_user)):
    updated = crud.update_team(db, team_id, team_upd)
    if not updated:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Team not found")
    return updated

# @router.delete("/{team_id}")
# def delete_team(team_id: int, db: Session = Depends(get_db), admin_user: dict = Depends(get_current_user)):
#     success = crud.delete_team(db, team_id)
#     if not success:
#         raise HTTPException(status.HTTP_404_NOT_FOUND, "Team not found")
#     return {"message": "Team deleted successfully"}
