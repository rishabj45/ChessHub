### backend/app/models.py
from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
from sqlalchemy import Enum as SQLEnum
from .enums import TournamentStage, TournamentFormat, MatchResult , Tiebreaker , MatchLabel

class Tournament(Base):
    __tablename__ = "tournaments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    venue = Column(String(255))
    start_date = Column(DateTime, default=func.now())
    end_date = Column(DateTime)
    current_round = Column(Integer, default=0) 
    total_group_stage_rounds = Column(Integer)
    total_rounds=Column(Integer)
    format = Column(SQLEnum(TournamentFormat))
    stage = Column(SQLEnum(TournamentStage), default=TournamentStage.not_yet_started)
    is_current = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    group_standings_validated = Column(Boolean, default=False)   
    best_players_validated = Column(Boolean, default=False)  

    teams = relationship("Team", back_populates="tournament", cascade="all, delete-orphan")
    matches = relationship("Match", back_populates="tournament", cascade="all, delete-orphan")
    rounds = relationship("Round", back_populates="tournament", cascade="all, delete-orphan")
    announcements = relationship("Announcement", back_populates="tournament", cascade="all, delete-orphan")

class Team(Base):
    __tablename__ = "teams"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=False)
    group = Column(Integer, default= 1)
    matches_played = Column(Integer, default=0)
    wins = Column(Integer, default=0)
    draws = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    match_points = Column(Float, default=0.0)
    game_points = Column(Float, default=0.0)
    sonneborn_berger = Column(Float, default=0.0)
    manual_tb4 = Column(Integer, nullable=True)
    standings_snapshot_at = Column(DateTime, nullable=True)
    captain_id = Column(Integer, ForeignKey("players.id"))
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    tournament = relationship("Tournament", back_populates="teams")
    players = relationship("Player", back_populates="team", cascade="all, delete-orphan", foreign_keys="Player.team_id")
    captain = relationship("Player", foreign_keys=[captain_id])
    white_matches = relationship("Match", back_populates="white_team", foreign_keys="Match.white_team_id", cascade="all, delete-orphan")
    black_matches = relationship("Match", back_populates="black_team", foreign_keys="Match.black_team_id", cascade="all, delete-orphan")

class Player(Base):
    __tablename__ = "players"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    rating = Column(Integer, default=1200)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    games_played = Column(Integer, default=0)
    wins = Column(Integer, default=0)
    draws = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    points = Column(Float, default=0.0)
    manual_tb3 = Column(Integer, nullable=True)                         
    snapshot_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    team = relationship("Team", back_populates="players", foreign_keys=[team_id])

class Round(Base):
    __tablename__ = "rounds"
    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=False)
    stage = Column(SQLEnum(TournamentStage), nullable=False, default=TournamentStage.group)
    round_number = Column(Integer)
    start_date = Column(DateTime)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())

    tournament = relationship("Tournament", back_populates="rounds")
    matches = relationship("Match", back_populates="round", cascade="all, delete-orphan")

class Match(Base):
    __tablename__ = "matches"
    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=False)
    round_id = Column(Integer, ForeignKey("rounds.id"), nullable=False)
    label = Column(SQLEnum(MatchLabel), nullable=False, default=MatchLabel.group)
    round_number = Column(Integer)
    group = Column(Integer, default= 1)
    white_team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    black_team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    white_score = Column(Float, default=0.0)
    black_score = Column(Float, default=0.0)
    result = Column(SQLEnum(MatchResult),default=MatchResult.pending)
    start_date = Column(DateTime)
    is_completed = Column(Boolean, default=False)
    tiebreaker = Column(SQLEnum(Tiebreaker),default=Tiebreaker.no_tiebreaker)
    winner_team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    tournament = relationship("Tournament", back_populates="matches")
    round = relationship("Round", back_populates="matches")
    games = relationship("Game", back_populates="match", cascade="all, delete-orphan")
    white_team = relationship("Team", foreign_keys=[white_team_id], back_populates="white_matches")
    black_team = relationship("Team", foreign_keys=[black_team_id], back_populates="black_matches")
    
class Game(Base):
    __tablename__ = "games"
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False)
    board_number = Column(Integer, nullable=False)
    white_player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    black_player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    result = Column(SQLEnum(MatchResult),default=MatchResult.pending)
    white_score = Column(Float, default=0.0)
    black_score = Column(Float, default=0.0)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    match = relationship("Match", back_populates="games")
    white_player = relationship("Player", foreign_keys=[white_player_id])
    black_player = relationship("Player", foreign_keys=[black_player_id])

class Announcement(Base):
    __tablename__ = "announcements"
    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    is_pinned = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    tournament = relationship("Tournament", back_populates="announcements")
