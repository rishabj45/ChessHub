### backend/app/crud.py
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from . import models, schemas
from .utilities.tournament import create_tournament_structure
from sqlalchemy.orm import joinedload

# -- Tournament CRUD --
def get_tournament(db: Session, tournament_id: int) -> Optional[models.Tournament]:
    return db.query(models.Tournament).filter(models.Tournament.id == tournament_id).first()

def get_current_tournament(db: Session) -> Optional[models.Tournament]:
    current = db.query(models.Tournament).filter(models.Tournament.is_current == True).first()
    if current:
        return current
    return db.query(models.Tournament).order_by(models.Tournament.created_at.desc()).first()

def get_tournaments(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Tournament).order_by(models.Tournament.id).offset(skip).limit(limit).all()

def create_tournament(db: Session, tournament: schemas.TournamentCreate) -> models.Tournament:
    return create_tournament_structure(db, tournament)

def update_tournament(db: Session, tournament_id: int, tournament_update: schemas.TournamentUpdate) -> Optional[models.Tournament]:
    tour = get_tournament(db, tournament_id)
    if not tour:
        return None
    data = tournament_update.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(tour, field, value)
    db.commit()
    db.refresh(tour)
    return tour

def delete_tournament(db: Session, tournament_id: int) -> bool:
    tour = get_tournament(db, tournament_id)
    if not tour:
        return False
    db.delete(tour)
    db.commit()
    return True

def set_current_tournament(db: Session, tournament_id: int) -> Optional[models.Tournament]:
    tour = get_tournament(db, tournament_id)
    if not tour:
        return None
    db.query(models.Tournament).update({models.Tournament.is_current: False})
    tour.is_current = True
    db.commit()
    db.refresh(tour)
    return tour

# -- Team CRUD --
def get_team(db: Session, team_id: int) -> Optional[models.Team]:
    return db.query(models.Team).filter(models.Team.id == team_id).first()

def get_teams(db: Session, tournament_id: int) -> List[models.Team]:
    return db.query(models.Team).filter(models.Team.tournament_id == tournament_id).order_by(models.Team.id).all()
        
def update_team(db: Session, team_id: int, team_update: schemas.TeamUpdate) -> Optional[models.Team]:
    team = get_team(db, team_id)
    if not team:
        return None
    data = team_update.model_dump(exclude_unset=True)
    if "name" in data:
        target_tournament_id = data.get("tournament_id", team.tournament_id)
        existing = db.query(models.Team).filter(
            models.Team.tournament_id == target_tournament_id,
            models.Team.name == data["name"],
            models.Team.id != team_id
        ).first()
        if existing:
            raise ValueError("Team name already exists in the target tournament")

    for field, value in data.items():
        setattr(team, field, value)
    db.commit()
    db.refresh(team)
    return team

# -- Player CRUD --
def get_player(db: Session, player_id: int) -> Optional[models.Player]:
    return db.query(models.Player).filter(models.Player.id == player_id).first()

def get_players(db: Session, team_id: Optional[int] = None, tournament_id: Optional[int] = None) -> List[models.Player]:
    query = db.query(models.Player)
    if team_id:
        query = query.filter(models.Player.team_id == team_id)
    if tournament_id:
        query = query.join(models.Team, models.Player.team_id == models.Team.id).filter(models.Team.tournament_id == tournament_id)
    return query.order_by(models.Player.id).all()

def create_player(db: Session, player: schemas.PlayerCreate) -> models.Player:
    data = player.model_dump()
    team_id = data.get("team_id")
    name = data.get("name")
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        return None
    existing = db.query(models.Player).filter(
        models.Player.team_id == team_id,
        models.Player.name == name
    ).first()
    if existing:
        raise ValueError("Player name already exists in the same team")
    db_player = models.Player(**data)
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    return db_player

def update_player(db: Session, player_id: int, player_update: schemas.PlayerUpdate) -> Optional[models.Player]:
    player = get_player(db, player_id)
    if not player:
        return None
    data = player_update.model_dump(exclude_unset=True)
    if "name" in data:
        target_team_id = data.get("team_id", player.team_id)
        existing = db.query(models.Player).filter(
            models.Player.team_id == target_team_id,
            models.Player.name == data["name"],
            models.Player.id != player_id
        ).first()
        if existing:
            raise ValueError("Player name already exists in the same team")

    for field, value in data.items():
        setattr(player, field, value)
    db.commit()
    db.refresh(player)
    return player

def delete_player(db: Session, player_id: int) -> bool:
    player = get_player(db, player_id)
    if not player:
        return False
    db.delete(player)
    db.commit()
    return True

# -- Match/Result CRUD --
def get_match(db: Session, match_id: int) -> Optional[models.Match]:
    return db.query(models.Match).filter(models.Match.id == match_id).first()

def get_matches(db: Session, round_number: int, tournament_id: int) -> List[models.Match]:
    matches = db.query(models.Match).filter(
        models.Match.tournament_id == tournament_id,
        models.Match.round_number == round_number
    ).order_by(models.Match.id).all()
    return matches

def calculate_standings(db: Session, tournament_id: int):
    teams = db.query(models.Team).filter(
        models.Team.tournament_id == tournament_id
    ).order_by(models.Team.id).all()
    
    standings = []
    for team in teams:
        standings.append({
            "team_id": team.id,
            "team_name": team.name,
            "group":team.group,
            "match_points": team.match_points,
            "game_points": team.game_points,
            "sonneborn_berger": team.sonneborn_berger,
            "manual_tb4": team.manual_tb4,
            "wins": team.wins,
            "losses": team.losses,
            "draws": team.draws,
            "matches_played": team.matches_played
        })
    standings.sort(key=lambda x: (x["group"], -x["match_points"], -x["game_points"], -x["sonneborn_berger"], x["manual_tb4"]))

    return standings
 
def get_best_players(db: Session, tournament_id: int):
    """Get best players using pre-calculated player statistics"""
    players = db.query(models.Player).join(
        models.Team, models.Player.team_id == models.Team.id
    ).filter(
        models.Team.tournament_id == tournament_id
    ).order_by(models.Player.id).all()
    
    player_stats = []
    for player in players:
        player_stats.append({
            "player_id": player.id,
            "player_name": player.name,
            "points": player.points,
            "wins": player.wins,
            "tb3": player.manual_tb3,
            "games_played": player.games_played,
            "draws": player.draws,
            "losses": player.losses,
        })
    player_stats.sort(key=lambda x: (-x["points"], -x["wins"], x["tb3"]))
    
    return player_stats

# -- Announcement CRUD --
def get_tournament_announcements(db: Session, tournament_id: int) -> List[models.Announcement]:
    return db.query(models.Announcement).filter(
        models.Announcement.tournament_id == tournament_id
    ).order_by(
        models.Announcement.is_pinned.desc(),
        models.Announcement.created_at.desc()
    ).all()

def get_announcement(db: Session, announcement_id: int) -> Optional[models.Announcement]:
    return db.query(models.Announcement).filter(models.Announcement.id == announcement_id).first()

def create_announcement(db: Session, announcement: schemas.AnnouncementCreate) -> models.Announcement:
    db_announcement = models.Announcement(**announcement.dict())
    db.add(db_announcement)
    db.commit()
    db.refresh(db_announcement)
    return db_announcement

def update_announcement(db: Session, announcement_id: int, announcement_update: schemas.AnnouncementUpdate) -> models.Announcement:
    db_announcement = db.query(models.Announcement).filter(models.Announcement.id == announcement_id).first()
    if db_announcement:
        for field, value in announcement_update.dict(exclude_unset=True).items():
            setattr(db_announcement, field, value)
        db.commit()
        db.refresh(db_announcement)
    return db_announcement

def delete_announcement(db: Session, announcement_id: int) -> bool:
    db_announcement = db.query(models.Announcement).filter(models.Announcement.id == announcement_id).first()
    if db_announcement:
        db.delete(db_announcement)
        db.commit()
        return True
    return False
