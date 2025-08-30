### backend/app/api/announcements.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas
from ..database import get_db
from ..utilities.auth import get_current_user

router = APIRouter(prefix="/api", tags=["announcements"])

@router.get("/tournaments/{tournament_id}/announcements", response_model=schemas.AnnouncementListResponse)
def get_tournament_announcements(
    tournament_id: int,
    db: Session = Depends(get_db)
):
    """Get all announcements for a tournament, ordered by pinned status and creation date"""
    announcements = crud.get_tournament_announcements(db, tournament_id)
    return {"announcements": announcements}

@router.post("/tournaments/{tournament_id}/announcements", response_model=schemas.AnnouncementResponse)
def create_announcement(
    tournament_id: int,
    announcement: schemas.AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new announcement for a tournament (admin only)"""
    # Check if tournament exists
    tournament = crud.get_tournament(db, tournament_id)
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    # Set the tournament_id from the URL
    announcement.tournament_id = tournament_id
    
    return crud.create_announcement(db, announcement)

@router.put("/announcements/{announcement_id}", response_model=schemas.AnnouncementResponse)
def update_announcement(
    announcement_id: int,
    announcement_update: schemas.AnnouncementUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update an existing announcement (admin only)"""
    announcement = crud.get_announcement(db, announcement_id)
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    return crud.update_announcement(db, announcement_id, announcement_update)

@router.delete("/announcements/{announcement_id}")
def delete_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete an announcement (admin only)"""
    announcement = crud.get_announcement(db, announcement_id)
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    crud.delete_announcement(db, announcement_id)
    return {"message": "Announcement deleted successfully"}
