### backend/app/schemas.py
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from .enums import TournamentStage, TournamentFormat, MatchResult,Tiebreaker ,MatchLabel

# -- Tournament Schemas --
class TournamentBase(BaseModel):
    name: str
    description: Optional[str] = None
    venue: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    format: TournamentFormat

class TournamentCreate(TournamentBase):
    team_names: List[str]

class TournamentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    venue: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class TournamentResponse(TournamentBase):
    id: int
    current_round: int
    total_group_stage_rounds: int
    total_rounds:int
    stage: TournamentStage
    group_standings_validated: bool
    best_players_validated: bool
    announcements: List['AnnouncementResponse'] = []
    class Config:
        from_attributes = True

# -- Team Schemas --
class TeamBase(BaseModel):
    name: str
    tournament_id: int

class TeamUpdate(BaseModel):
    name: Optional[str] = None

class TeamResponse(TeamBase):
    id: int
    group:int
    class Config:
        from_attributes = True

# -- Player Schemas --
class PlayerBase(BaseModel):
    name: str
    team_id: int

class PlayerCreate(PlayerBase):
    rating: Optional[float] = None

class PlayerUpdate(BaseModel):
    name: Optional[str] = None
    rating: Optional[float] = None

class PlayerResponse(PlayerBase):
    id: int
    rating: int
    class Config:
        from_attributes = True

# -- Game/Round/Match Schemas --
class GameResponse(BaseModel):
    id: int
    board_number: int
    white_player_id: int
    black_player_id: int
    result: MatchResult
    white_score: float
    black_score: float
    is_completed: bool
    class Config:
        from_attributes = True

class ResultUpdate(BaseModel):
    result:MatchResult
class MatchResponse(BaseModel):
    id: int
    round_number: int
    white_team_id: Optional[int] = None 
    black_team_id: Optional[int] = None 
    white_score: float
    black_score: float
    result: MatchResult
    label:MatchLabel
    start_date: Optional[datetime] = None
    is_completed: bool
    games: List[GameResponse]
    tiebreaker:Tiebreaker
    
    class Config:
        from_attributes = True

class StandingsEntry(BaseModel):
    team_id: int
    team_name: str
    group:int
    matches_played: int
    wins: int
    draws: int
    losses: int
    match_points: float
    game_points: float
    sonneborn_berger: float
    manual_tb4: float
    class Config:
        from_attributes = True

class StandingsResponse(BaseModel):
    standings: List[StandingsEntry]

class BestPlayerEntry(BaseModel):
    player_id: int
    player_name: str
    games_played: int
    wins: int
    draws: int
    losses: int
    points: float
    tb3: float
    
class BestPlayersResponse(BaseModel):
    players: List[BestPlayerEntry]

class RoundRescheduleRequest(BaseModel):
    start_date: datetime

class SwapPlayersRequest(BaseModel):
    player1_id: int
    player2_id: int

class TeamSwapData(BaseModel):
    player1_id: int
    player2_id: int

class ColorSwapRequest(BaseModel):
    pass

# -- Announcement Schemas --
class AnnouncementBase(BaseModel):
    title: str
    content: str
    is_pinned: bool = False

class AnnouncementCreate(AnnouncementBase):
    tournament_id: int

class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_pinned: Optional[bool] = None

class AnnouncementResponse(AnnouncementBase):
    id: int
    tournament_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class AnnouncementListResponse(BaseModel):
    announcements: List[AnnouncementResponse]
