from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..auth_utils import get_current_user
from ..models import Tiebreaker
from ..schemas import TiebreakerResponse, TiebreakerSelectWinnerRequest
from .. import tournament_logic

router = APIRouter(prefix="/api/tiebreakers", tags=["tiebreakers"])

@router.get("/round/{tournament_id}/{round_number}", response_model=List[TiebreakerResponse])
def get_tiebreakers_for_round(
    tournament_id: int, 
    round_number: int, 
    db: Session = Depends(get_db)
):
    """Get all tiebreakers for a specific round"""
    return tournament_logic.get_tiebreakers_for_round(db, tournament_id, round_number)

@router.post("/{tiebreaker_id}/select-winner")
def select_tiebreaker_winner(
    tiebreaker_id: int,
    request: TiebreakerSelectWinnerRequest,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user)  # Admin only
):
    """Select the winner of a tiebreaker"""
    success = tournament_logic.complete_tiebreaker(db, tiebreaker_id, request.winner_team_id)
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Invalid tiebreaker or winner team"
        )
    return {"message": "Tiebreaker winner selected successfully"}

@router.get("/check/{tournament_id}/{round_number}")
def check_tiebreakers_needed(
    tournament_id: int,
    round_number: int,
    db: Session = Depends(get_db)
):
    """Check if tiebreakers are needed for a round"""
    matches_needing_tiebreakers = tournament_logic.check_for_tiebreakers_needed(
        db, tournament_id, round_number
    )
    all_completed = tournament_logic.all_tiebreakers_completed(
        db, tournament_id, round_number
    )
    
    return {
        "needs_tiebreakers": len(matches_needing_tiebreakers) > 0,
        "tiebreaker_matches": matches_needing_tiebreakers,
        "all_tiebreakers_completed": all_completed
    }
