### backend/app/schemas.py
from typing import List, Optional, Literal
from datetime import datetime
from pydantic import BaseModel, field_validator

TournamentFormat = Literal["round_robin", "group_knockout"]

# -- Tournament Schemas --
class TournamentBase(BaseModel):
    name: str
    description: Optional[str] = None
    venue: Optional[str] = None
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    format: TournamentFormat = "round_robin"

class TournamentCreate(TournamentBase):
    name: str
    description: Optional[str] = None
    venue: Optional[str] = None
    start_date: Optional[datetime]
    end_date: Optional[datetime] = None
    format: TournamentFormat = "round_robin"
    team_names: List[str]
    players_per_team: List[int]

class TournamentUpdate(BaseModel):
    name: Optional[str]
    description: Optional[str]
    venue: Optional[str]
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    format: Optional[TournamentFormat]

class TournamentResponse(TournamentBase):
    id: int
    current_round: int
    total_rounds: Optional[int]
    format: TournamentFormat
    stage: str  # not_yet_started, group, semi_final, final, completed
    announcement: Optional[str] = None
    class Config:
        from_attributes = True

# -- Team Schemas --
class TeamBase(BaseModel):
    name: str
    tournament_id: int

class TeamCreate(TeamBase):
    pass

class TeamUpdate(BaseModel):
    name: Optional[str]

class TeamResponse(TeamBase):
    id: int
    match_points: float
    game_points: float
    class Config:
        from_attributes = True

# -- Player Schemas --
class PlayerBase(BaseModel):
    name: str
    team_id: int
    position: Optional[int]

class PlayerCreate(BaseModel):
    name: str
    team_id: int
    rating: Optional[float] = None
    position: Optional[int] 

class PlayerUpdate(BaseModel):
    name: Optional[str]
    rating: Optional[float] = None
    position: Optional[int]

class PlayerResponse(PlayerBase):
    id: int
    rating: int
    games_played: int
    wins: int
    draws: int
    losses: int
    points: float
    class Config:
        from_attributes = True

# -- Game/Round/Match Schemas --
class GameCreate(BaseModel):
    white_player_id: int
    black_player_id: int
    board_number: int

class GameResponse(BaseModel):
    id: int
    board_number: int
    white_player_id: int
    black_player_id: int
    result: Optional[str]
    white_score: float
    black_score: float
    is_completed: bool
    class Config:
        from_attributes = True

class GameSimpleResultUpdate(BaseModel):
    result: str  # 'white_win', 'black_win', 'draw', or 'pending'

    @field_validator("result")
    @classmethod
    def validate_result(cls, v):
        allowed = {"white_win", "black_win", "draw", "pending"}
        if v not in allowed:
            raise ValueError(f"result must be one of {allowed}")
        return v

class TiebreakerResponse(BaseModel):
    id: int
    match_id: int
    white_team_id: int
    black_team_id: int
    winner_team_id: Optional[int]
    is_completed: bool
    class Config:
        from_attributes = True

class RoundResponse(BaseModel):
    round_number: int
    is_completed: bool
    games: List[GameResponse]

class MatchResponse(BaseModel):
    id: int
    round_number: int
    white_team_id: int
    black_team_id: int
    white_score: float
    black_score: float
    result: Optional[str]
    scheduled_date: Optional[datetime]
    is_completed: bool
    games: List[GameResponse]
    tiebreaker: Optional[TiebreakerResponse] = None
    class Config:
        from_attributes = True

class StandingsEntry(BaseModel):
    team_id: int
    team_name: str
    matches_played: int
    wins: int
    draws: int
    losses: int
    match_points: float
    game_points: float
    sonneborn_berger: float
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
    
class BestPlayersResponse(BaseModel):
    tournament_id: int
    tournament_name: str
    players: List[BestPlayerEntry]

class MatchRescheduleRequest(BaseModel):
    scheduled_date: datetime

class SwapPlayersRequest(BaseModel):
    new_white_player_id: Optional[int] = None
    new_black_player_id: Optional[int] = None
    reason: Optional[str] = None  # For audit trail

class TeamSwapData(BaseModel):
    player1_id: int
    player2_id: int

class MatchSwapRequest(BaseModel):
    white_team_swaps: List[TeamSwapData] = []
    black_team_swaps: List[TeamSwapData] = []

class ColorSwapRequest(BaseModel):
    """Request to swap team colors in a knockout match"""
    pass  # No additional data needed - just swap all players' colors

class TiebreakerResponse(BaseModel):
    id: int
    match_id: int
    white_team_id: int
    black_team_id: int
    winner_team_id: Optional[int]
    is_completed: bool
    class Config:
        from_attributes = True

class TiebreakerSelectWinnerRequest(BaseModel):
    winner_team_id: int