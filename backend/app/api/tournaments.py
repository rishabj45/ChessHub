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

@router.post("/{tournament_id}/set-current", response_model=TournamentResponse)
def set_current_tournament(tournament_id: int, db: Session = Depends(get_db),
                           _: dict = Depends(get_current_user)):
    """Set a tournament as the current one (admin only)."""
    updated = crud.set_current_tournament(db, tournament_id)
    if not updated:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tournament not found")
    return updated

@router.get("/{tournament_id}/standings", response_model=StandingsResponse)
def get_standings(tournament_id: int, db: Session = Depends(get_db)):
    tour = crud.get_tournament(db, tournament_id)
    if not tour:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tournament not found")
    standings = tournament_logic.calculate_standings(db, tournament_id)
    return StandingsResponse(standings=standings)

@router.get("/{tournament_id}/group-standings")
def get_group_standings(tournament_id: int, db: Session = Depends(get_db)):
    """Get group standings for group+knockout format tournaments."""
    tour = crud.get_tournament(db, tournament_id)
    if not tour:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tournament not found")
    
    if tour.format != "group_knockout":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Tournament is not in group+knockout format")
    
    group_standings = tournament_logic.calculate_group_standings(db, tournament_id)
    return group_standings

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

@router.post("/{tournament_id}/start")
def start_tournament_endpoint(tournament_id: int, db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    """Start a tournament (admin only) - changes stage from not_yet_started to group."""
    success = tournament_logic.start_tournament(db, tournament_id)
    if not success:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot start tournament - already started or insufficient teams")
    return {"message": "Tournament started successfully"}

@router.get("/{tournament_id}/can-complete")
def can_complete_tournament(tournament_id: int, db: Session = Depends(get_db)):
    """Check if tournament can be completed (final and 3rd place matches are done)."""
    can_complete = tournament_logic.can_complete_tournament(db, tournament_id)
    return {"can_complete": can_complete}

@router.post("/{tournament_id}/complete")
def complete_tournament(tournament_id: int, db: Session = Depends(get_db), 
                       _: dict = Depends(get_current_user)):
    """Complete the tournament (admin only)."""
    success = tournament_logic.complete_tournament(db, tournament_id)
    if not success:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, 
            "Cannot complete tournament. Ensure final and 3rd place matches are completed."
        )
    return {"message": "Tournament completed successfully"}

@router.get("/{tournament_id}/final-rankings")
def get_final_rankings(tournament_id: int, db: Session = Depends(get_db)):
    """Get final top 3 rankings for a completed tournament."""
    rankings = tournament_logic.get_final_rankings(db, tournament_id)
    if not rankings:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, 
            "Cannot get final rankings. Tournament must be completed."
        )
    return rankings

@router.get("/{tournament_id}/rounds/{round_number}/can-complete")
def can_complete_round(tournament_id: int, round_number: int, db: Session = Depends(get_db)):
    """Check if a specific round can be manually completed."""
    result = tournament_logic.can_complete_round(db, tournament_id, round_number)
    return result

@router.post("/{tournament_id}/rounds/{round_number}/complete")
def complete_round(tournament_id: int, round_number: int, db: Session = Depends(get_db), 
                  _: dict = Depends(get_current_user)):
    """Manually complete a specific round (admin only)."""
    # First check if the round can be completed
    check_result = tournament_logic.can_complete_round(db, tournament_id, round_number)
    if not check_result["can_complete"]:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, 
            f"Cannot complete round {round_number}: {check_result['reason']}"
        )
    
    success = tournament_logic.manual_complete_round(db, tournament_id, round_number)
    if not success:
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR, 
            "Failed to complete round"
        )
    
    # Final recalculation after potential automatic stage advancement
    tournament_logic.recalculate_tournament_stats(db, tournament_id)
    
    # Include completion info in response
    return {
        "message": f"Round {round_number} completed successfully",
        "round_info": check_result
    }

@router.get("/{tournament_id}/announcement")
def get_tournament_announcement(tournament_id: int, db: Session = Depends(get_db)):
    """Get the tournament announcement."""
    tournament = crud.get_tournament(db, tournament_id)
    if not tournament:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tournament not found")
    
    return {"announcement": tournament.announcement or ""}

@router.post("/{tournament_id}/announcement")
def update_tournament_announcement(
    tournament_id: int, 
    announcement_data: dict,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user)
):
    """Update the tournament announcement (admin only)."""
    tournament = crud.get_tournament(db, tournament_id)
    if not tournament:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tournament not found")
    
    announcement = announcement_data.get("announcement", "")
    
    # Update the tournament announcement
    success = crud.update_tournament_announcement(db, tournament_id, announcement)
    if not success:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to update announcement")
    
    return {"message": "Announcement updated successfully", "announcement": announcement}
