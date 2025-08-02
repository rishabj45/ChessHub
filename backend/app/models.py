### backend/app/models.py
from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class Tournament(Base):
    __tablename__ = "tournaments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    venue = Column(String(255))
    start_date = Column(DateTime, default=func.now())
    end_date = Column(DateTime)
    current_round = Column(Integer, default=0)  # 0 when not started, 1+ when started
    total_rounds = Column(Integer)
    format = Column(String(50), default="round_robin")
    stage = Column(String(50), default="not_yet_started")  # not_yet_started, group, semi_final, final, completed
    is_current = Column(Boolean, default=False)
    announcement = Column(Text)  # Tournament announcements by admin
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    teams = relationship("Team", back_populates="tournament", cascade="all, delete-orphan")
    matches = relationship("Match", back_populates="tournament", cascade="all, delete-orphan")
    rounds = relationship("Round", back_populates="tournament", cascade="all, delete-orphan")

class Team(Base):
    __tablename__ = "teams"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=False)
    captain_id = Column(Integer, ForeignKey("players.id"))
    matches_played = Column(Integer, default=0)
    wins = Column(Integer, default=0)
    draws = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    match_points = Column(Float, default=0.0)  
    game_points = Column(Float, default=0.0)   
    sonneborn_berger = Column(Float, default=0.0)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    tournament = relationship("Tournament", back_populates="teams")
    players = relationship("Player", back_populates="team", cascade="all, delete-orphan", foreign_keys="[Player.team_id]")
    captain = relationship("Player", foreign_keys=[captain_id])

class Player(Base):
    __tablename__ = "players"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    rating = Column(Integer, default=1200)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    position = Column(Integer, default=1)
    games_played = Column(Integer, default=0)
    wins = Column(Integer, default=0)
    draws = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    points = Column(Float, default=0.0)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    team = relationship("Team", back_populates="players", foreign_keys=[team_id])
    

class Round(Base):
    __tablename__ = "rounds"
    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=False)
    round_number = Column(Integer, nullable=False)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())

    tournament = relationship("Tournament", back_populates="rounds")
    matches = relationship("Match", back_populates="round", cascade="all, delete-orphan")

class Match(Base):
    __tablename__ = "matches"
    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=False)
    round_id = Column(Integer, ForeignKey("rounds.id"), nullable=False)
    round_number = Column(Integer, nullable=False)
    white_team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    black_team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    white_score = Column(Float, default=0.0)
    black_score = Column(Float, default=0.0)
    result = Column(String(10))
    scheduled_date = Column(DateTime)
    completed_date = Column(DateTime)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    tournament = relationship("Tournament", back_populates="matches")
    round = relationship("Round", back_populates="matches")
    games = relationship("Game", back_populates="match", cascade="all, delete-orphan")

class Game(Base):
    __tablename__ = "games"
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False)
    board_number = Column(Integer, nullable=False)
    white_player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    black_player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    result = Column(String(10))
    white_score = Column(Float, default=0.0)
    black_score = Column(Float, default=0.0)
    is_completed = Column(Boolean, default=False)
    notes = Column(Text)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    match = relationship("Match", back_populates="games")
    white_player = relationship("Player", foreign_keys=[white_player_id])
    black_player = relationship("Player", foreign_keys=[black_player_id])

class Tiebreaker(Base):
    __tablename__ = "tiebreakers"
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False)
    white_team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    black_team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    winner_team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    match = relationship("Match")
    white_team = relationship("Team", foreign_keys=[white_team_id])
    black_team = relationship("Team", foreign_keys=[black_team_id])
    winner_team = relationship("Team", foreign_keys=[winner_team_id])
