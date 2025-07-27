### backend/app/crud.py
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from fastapi import HTTPException
from . import models, schemas
from .tournament_logic import create_tournament_structure
from collections import defaultdict

# -- Tournament CRUD --
def get_tournament(db: Session, tournament_id: int) -> Optional[models.Tournament]:
    return db.query(models.Tournament).filter(models.Tournament.id == tournament_id).first()

def get_current_tournament(db: Session) -> Optional[models.Tournament]:
    """
    Get the tournament marked as current.
    If none is marked as current, return the most recently created one.
    """
    # First try to get the tournament marked as current
    current = db.query(models.Tournament).filter(models.Tournament.is_current == True).first()
    if current:
        return current
    
    # Fallback to most recently created tournament
    return db.query(models.Tournament).order_by(models.Tournament.created_at.desc()).first()

def get_tournaments(db: Session, skip: int = 0, limit: int = 100) -> List[models.Tournament]:
    return db.query(models.Tournament).offset(skip).limit(limit).all()

def create_tournament(db: Session, tournament: schemas.TournamentCreate) -> models.Tournament:
    """
    Create full tournament structure.
    """
    return create_tournament_structure(db, tournament)

def update_tournament(db: Session, tournament_id: int, tournament_update: schemas.TournamentUpdate) -> Optional[models.Tournament]:
    tour = get_tournament(db, tournament_id)
    if not tour:
        return None
    data = tournament_update.dict(exclude_unset=True)
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
    """Set a tournament as the current one, unsetting all others."""
    # First, unset all current tournaments
    db.query(models.Tournament).update({models.Tournament.is_current: False})
    
    # Then set the specified tournament as current
    tour = get_tournament(db, tournament_id)
    if not tour:
        return None
    
    tour.is_current = True
    db.commit()
    db.refresh(tour)
    return tour

# -- Team CRUD --
def get_team(db: Session, team_id: int) -> Optional[models.Team]:
    return db.query(models.Team).filter(models.Team.id == team_id).first()

def get_teams(db: Session, tournament_id: Optional[int] = None) -> List[models.Team]:
    query = db.query(models.Team)
    if tournament_id:
        query = query.filter(models.Team.tournament_id == tournament_id)
    return query.all()

def create_team(db: Session, team: schemas.TeamCreate) -> models.Team:
    db_team = models.Team(**team.dict())
    db.add(db_team)
    db.commit()
    db.refresh(db_team)
    return db_team

def update_team(db: Session, team_id: int, team_update: schemas.TeamUpdate) -> Optional[models.Team]:
    team = get_team(db, team_id)
    if not team:
        return None
    data = team_update.dict(exclude_unset=True)
    for field, value in data.items():
        setattr(team, field, value)
    db.commit()
    db.refresh(team)
    return team

def delete_team(db: Session, team_id: int) -> bool:
    team = get_team(db, team_id)
    if not team:
        return False
    db.delete(team)
    db.commit()
    return True

# -- Player CRUD --
def get_player(db: Session, player_id: int) -> Optional[models.Player]:
    return db.query(models.Player).filter(models.Player.id == player_id).first()

def get_players(db: Session, team_id: Optional[int] = None, tournament_id: Optional[int] = None) -> List[models.Player]:
    query = db.query(models.Player)
    if team_id:
        query = query.filter(models.Player.team_id == team_id)
    if tournament_id:
        query = query.join(models.Team).filter(models.Team.tournament_id == tournament_id)
    return query.all()

def get_player_by_name_in_team(db: Session, name: str, team_id: int) -> Optional[models.Player]:
    return db.query(models.Player).filter(
        and_(models.Player.team_id == team_id, models.Player.name == name)
    ).first()

def create_player(db: Session, player: schemas.PlayerCreate) -> models.Player:
    db_player = models.Player(**player.dict())
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    return db_player

def update_player(db: Session, player_id: int, player_update: schemas.PlayerUpdate) -> Optional[models.Player]:
    player = get_player(db, player_id)
    if not player:
        return None
    data = player_update.dict(exclude_unset=True)
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

def adjust_player_positions_after_deletion(db: Session, team_id: int, deleted_position: int):
    """
    Shift up player positions after deletion.
    """
    players = db.query(models.Player).filter(models.Player.team_id == team_id).order_by(models.Player.position).all()
    for p in players:
        if p.position > deleted_position:
            p.position -= 1
    db.commit()

# -- Match/Result CRUD --
def get_match(db: Session, match_id: int) -> Optional[models.Match]:
    return db.query(models.Match).filter(models.Match.id == match_id).first()

def get_matches(db: Session, round_id: Optional[int] = None, tournament_id: Optional[int] = None) -> List[models.Match]:
    query = db.query(models.Match)
    if round_id:
        query = query.filter(models.Match.round_id == round_id)
    if tournament_id:
        query = query.filter(models.Match.tournament_id == tournament_id)
    return query.all()

def update_player_stats(db: Session, player_id: int, score: float):
    player = get_player(db, player_id)
    if not player:
        return
    player.games_played += 1
    player.points += score
    if score == 1.0:
        player.wins += 1
    elif score == 0.5:
        player.draws += 1
    else:
        player.losses += 1

def get_best_players(db: Session, tournament_id: int) -> list[schemas.BestPlayerEntry]:
    tour = db.query(models.Tournament).filter(models.Tournament.id == tournament_id).first()
    if not tour:
        return []

    # 🟢 Initialize schema objects directly
    player_map: dict[int, schemas.BestPlayerEntry] = {}

    for team in tour.teams:
        for player in team.players:
            player_map[player.id] = schemas.BestPlayerEntry(
                player_id=player.id,
                player_name=player.name,
                games_played=0,
                wins=0,
                draws=0,
                losses=0,
                points=0.0
            )

    # 🟡 Update stats directly on schema objects
    for match in tour.matches:
        for game in match.games:
            if not game.is_completed:
                continue

            white = player_map[game.white_player_id]
            black = player_map[game.black_player_id]

            white.games_played += 1
            black.games_played += 1

            white.points += game.white_score
            black.points += game.black_score

            def update_result(score: float, player: schemas.BestPlayerEntry):
                if score == 1.0:
                    player.wins += 1
                elif score == 0.5:
                    player.draws += 1
                else:
                    player.losses += 1

            update_result(game.white_score, white)
            update_result(game.black_score, black)

    # 🔵 Return only players who actually played
    return sorted(
        [p for p in player_map.values() ],
        key=lambda p: (-p.points, -p.wins)
    )