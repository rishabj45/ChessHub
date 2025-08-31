# ChessHub Backend API Reference

## Overview

ChessHub is a chess tournament management system built with FastAPI, SQLAlchemy, and PostgreSQL. This document provides a complete reference for frontend developers.

**Base URL**: All endpoints are prefixed with `/api/`

**Authentication**: JWT Bearer token authentication for protected endpoints

---

## 1. API Endpoints

### Authentication Endpoints

#### POST `/api/auth/login`
**Description**: Authenticate user and get JWT token  
**Authentication**: None required  
**Request Body**:
```json
{
  "username": "string",
  "password": "string"
}
```
**Response**:
```json
{
  "token": "string"
}
```
**Example**:
```json
// Request
{
  "username": "admin",
  "password": "secret"
}

// Response
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST `/api/auth/verify`
**Description**: Verify JWT token validity  
**Authentication**: Bearer token required  
**Response**:
```json
{
  "user": "string",
  "status": "valid"
}
```

---

### Tournament Endpoints

#### GET `/api/tournaments/current`
**Description**: Get the current active tournament  
**Authentication**: None required  
**Response**: `TournamentResponse` or `null`

#### GET `/api/tournaments/{tournament_id}`
**Description**: Get a specific tournament by ID  
**Authentication**: None required  
**Path Parameters**:
- `tournament_id` (integer): Tournament ID
**Response**: `TournamentResponse`

#### GET `/api/tournaments/`
**Description**: List all tournaments with pagination  
**Authentication**: None required  
**Query Parameters**:
- `skip` (integer, optional): Number of records to skip (default: 0)
- `limit` (integer, optional): Maximum records to return (default: 100)
**Response**: Array of `TournamentResponse`

#### POST `/api/tournaments/`
**Description**: Create a new tournament  
**Authentication**: Bearer token required  
**Request Body**: `TournamentCreate`
```json
{
  "name": "string",
  "description": "string (optional)",
  "venue": "string (optional)",
  "start_date": "2024-01-01T10:00:00 (optional)",
  "end_date": "2024-01-01T18:00:00 (optional)",
  "format": "round_robin | group_knockout | swiss",
  "team_names": ["Team A", "Team B", "Team C"]
}
```
**Response**: `TournamentResponse`

#### PUT `/api/tournaments/{tournament_id}`
**Description**: Update an existing tournament  
**Authentication**: Bearer token required  
**Path Parameters**:
- `tournament_id` (integer): Tournament ID
**Request Body**: `TournamentUpdate`
```json
{
  "name": "string (optional)",
  "description": "string (optional)",
  "venue": "string (optional)",
  "start_date": "datetime (optional)",
  "end_date": "datetime (optional)",
  "announcement": "string (optional)"
}
```
**Response**: `TournamentResponse`

#### DELETE `/api/tournaments/{tournament_id}`
**Description**: Delete a tournament  
**Authentication**: Bearer token required  
**Path Parameters**:
- `tournament_id` (integer): Tournament ID
**Response**:
```json
{
  "message": "Tournament deleted successfully"
}
```

#### POST `/api/tournaments/{tournament_id}/set-current`
**Description**: Set a tournament as the current active one  
**Authentication**: Bearer token required  
**Path Parameters**:
- `tournament_id` (integer): Tournament ID
**Response**: `TournamentResponse`

#### GET `/api/tournaments/{tournament_id}/standings`
**Description**: Get current tournament standings  
**Authentication**: None required  
**Path Parameters**:
- `tournament_id` (integer): Tournament ID
**Response**: `StandingsResponse`

#### GET `/api/tournaments/{tournament_id}/best-players`
**Description**: Get best players ranking  
**Authentication**: None required  
**Path Parameters**:
- `tournament_id` (integer): Tournament ID
**Response**: `BestPlayersResponse`

#### POST `/api/tournaments/{tournament_id}/start`
**Description**: Start a tournament (generates initial pairings)  
**Authentication**: Bearer token required  
**Path Parameters**:
- `tournament_id` (integer): Tournament ID
**Response**:
```json
{
  "message": "Tournament started successfully"
}
```

#### POST `/api/tournaments/{tournament_id}/round/{round_number}/reschedule`
**Description**: Reschedule a round's start time  
**Authentication**: Bearer token required  
**Path Parameters**:
- `tournament_id` (integer): Tournament ID
- `round_number` (integer): Round number
**Request Body**:
```json
{
  "start_date": "2024-01-01T10:00:00"
}
```
**Response**:
```json
{
  "message": "Rescheduled"
}
```

#### POST `/api/tournaments/{tournament_id}/round/{round_number}/complete`
**Description**: Mark a round as complete  
**Authentication**: Bearer token required  
**Path Parameters**:
- `tournament_id` (integer): Tournament ID
- `round_number` (integer): Round number
**Response**:
```json
{
  "message": "Round {round_number} completed successfully"
}
```

#### GET `/api/tournaments/{tournament_id}/round/{round_number}`
**Description**: Get round information including completion status  
**Authentication**: None required  
**Path Parameters**:
- `tournament_id` (integer): Tournament ID
- `round_number` (integer): Round number
**Response**:
```json
{
  "round_number": 1,
  "tournament_id": 1,
  "stage": "group",
  "start_date": "2024-01-01T10:00:00",
  "is_completed": true
}
```

#### GET `/api/tournaments/{tournament_id}/standings/check-tie`
**Description**: Check for tied positions in standings  
**Authentication**: None required  
**Path Parameters**:
- `tournament_id` (integer): Tournament ID
**Response**:
```json
{
  "tournament_id": 1,
  "has_ties": true,
  "ties": {
    "1": {
      "team1_id": ["team2_id", "team3_id"]
    }
  }
}
```

#### GET `/api/tournaments/{tournament_id}/best-players/check-tie`
**Description**: Check for tied positions in best players ranking  
**Authentication**: None required  
**Path Parameters**:
- `tournament_id` (integer): Tournament ID
**Response**:
```json
{
  "tournament_id": 1,
  "has_ties": true,
  "ties": {
    "player1_id": ["player2_id", "player3_id"]
  }
}
```

#### POST `/api/tournaments/{tournament_id}/standings/tiebreaker`
**Description**: Resolve standings ties manually  
**Authentication**: Bearer token required  
**Path Parameters**:
- `tournament_id` (integer): Tournament ID
**Request Body**:
```json
{
  "first_team_id": 1,
  "second_team_id": 2,
  "group": 1
}
```
**Response**: `true`

#### POST `/api/tournaments/{tournament_id}/best-player/tiebreaker`
**Description**: Resolve best players ties manually  
**Authentication**: Bearer token required  
**Path Parameters**:
- `tournament_id` (integer): Tournament ID
**Request Body**:
```json
{
  "first_player_id": 1,
  "second_player_id": 2
}
```
**Response**: `true`

#### POST `/api/tournaments/{tournament_id}/standings/validate`
**Description**: Validate standings and progress tournament stage  
**Authentication**: Bearer token required  
**Path Parameters**:
- `tournament_id` (integer): Tournament ID

#### POST `/api/tournaments/{tournament_id}/best-players/validate`
**Description**: Validate best players and complete tournament  
**Authentication**: Bearer token required  
**Path Parameters**:
- `tournament_id` (integer): Tournament ID

---

### Team Endpoints

#### GET `/api/teams`
**Description**: List teams for a tournament  
**Authentication**: None required  
**Query Parameters**:
- `tournament_id` (integer, required): Tournament ID
**Response**: Array of `TeamResponse`

#### GET `/api/teams/{team_id}`
**Description**: Get a specific team by ID  
**Authentication**: None required  
**Path Parameters**:
- `team_id` (integer): Team ID
**Response**: `TeamResponse`

#### PUT `/api/teams/{team_id}`
**Description**: Update team details  
**Authentication**: Bearer token required  
**Path Parameters**:
- `team_id` (integer): Team ID
**Request Body**: `TeamUpdate`
```json
{
  "name": "string (optional)"
}
```
**Response**: `TeamResponse`

---

### Player Endpoints

#### GET `/api/players`
**Description**: List players with optional filtering  
**Authentication**: None required  
**Query Parameters**:
- `team_id` (integer, optional): Filter by team ID
- `tournament_id` (integer, optional): Filter by tournament ID
**Response**: Array of `PlayerResponse`

#### GET `/api/players/{player_id}`
**Description**: Get a specific player by ID  
**Authentication**: None required  
**Path Parameters**:
- `player_id` (integer): Player ID
**Response**: `PlayerResponse`

#### POST `/api/players`
**Description**: Create a new player  
**Authentication**: Bearer token required  
**Request Body**: `PlayerCreate`
```json
{
  "name": "string",
  "team_id": 1,
  "rating": 1500
}
```
**Response**: `PlayerResponse`

#### PUT `/api/players/{player_id}`
**Description**: Update player details  
**Authentication**: Bearer token required  
**Path Parameters**:
- `player_id` (integer): Player ID
**Request Body**: `PlayerUpdate`
```json
{
  "name": "string (optional)",
  "rating": 1600
}
```
**Response**: `PlayerResponse`

#### DELETE `/api/players/{player_id}`
**Description**: Delete a player  
**Authentication**: Bearer token required  
**Path Parameters**:
- `player_id` (integer): Player ID
**Response**:
```json
{
  "message": "Player deleted successfully"
}
```

---

### Match Endpoints

#### GET `/api/matches/{tournament_id}/{round_number}`
**Description**: Get matches for a specific round  
**Authentication**: None required  
**Path Parameters**:
- `tournament_id` (integer): Tournament ID
- `round_number` (integer): Round number
**Response**: Array of `MatchResponse`

#### POST `/api/matches/{match_id}/result`
**Description**: Submit individual game result  
**Authentication**: Bearer token required  
**Path Parameters**:
- `match_id` (integer): Match ID
**Query Parameters**:
- `board_number` (integer): Board number (1-4)
**Request Body**:
```json
{
  "result": "pending | white_win | black_win | draw"
}
```
**Response**:
```json
{
  "message": "Game result 'white_win' submitted successfully"
}
```

#### POST `/api/matches/{match_id}/tiebreaker`
**Description**: Submit tiebreaker result  
**Authentication**: Bearer token required  
**Path Parameters**:
- `match_id` (integer): Match ID
**Request Body**:
```json
{
  "result": "white_win | black_win | tiebreaker"
}
```
**Response**:
```json
{
  "message": "Tiebreaker result recorded",
  "match_id": 1,
  "tiebreaker_result": "white_win"
}
```

#### GET `/api/matches/{match_id}/available-swaps`
**Description**: Get available player swaps for a match  
**Authentication**: Bearer token required  
**Path Parameters**:
- `match_id` (integer): Match ID
**Response**:
```json
{
  "white_team_players": [
    {"id": 1, "name": "Player A"}
  ],
  "black_team_players": [
    {"id": 5, "name": "Player E"}
  ],
  "current_assignments": [
    {
      "game_id": 1,
      "board_number": 1,
      "white_player_id": 1,
      "black_player_id": 5
    }
  ]
}
```

#### POST `/api/matches/{match_id}/swap-players`
**Description**: Swap two players in a match  
**Authentication**: Bearer token required  
**Path Parameters**:
- `match_id` (integer): Match ID
**Request Body**:
```json
{
  "player1_id": 1,
  "player2_id": 2
}
```

#### POST `/api/matches/{match_id}/swap-colors`
**Description**: Swap team colors in knockout matches  
**Authentication**: Bearer token required  
**Path Parameters**:
- `match_id` (integer): Match ID
**Response**:
```json
{
  "message": "Team colors swapped successfully",
  "match_id": 1
}
```

---

## 2. Data Models / Schemas

### TournamentResponse
```typescript
{
  id: number;
  name: string;
  description?: string;
  venue?: string;
  start_date?: string; // ISO datetime
  end_date?: string; // ISO datetime
  current_round: number;
  total_group_stage_rounds: number;
  total_rounds: number;
  format: "round_robin" | "group_knockout" | "swiss";
  stage: "not_yet_started" | "group" | "semi_final" | "final" | "completed";
  announcement?: string;
  group_standings_validated: boolean;
  best_players_validated: boolean;
}
```

### TeamResponse
```typescript
{
  id: number;
  name: string;
  tournament_id: number;
  group: number;
}
```

### PlayerResponse
```typescript
{
  id: number;
  name: string;
  team_id: number;
  rating: number;
}
```

### MatchResponse
```typescript
{
  id: number;
  round_number: number;
  white_team_id: number;
  black_team_id: number;
  white_score: number;
  black_score: number;
  result: "pending" | "white_win" | "black_win" | "draw" | "tiebreaker";
  label: "group" | "SF1" | "SF2" | "Final" | "3rd Place";
  start_date?: string; // ISO datetime
  is_completed: boolean;
  tiebreaker: "no_tiebreaker" | "pending" | "white_win" | "black_win";
  games: GameResponse[];
}
```

### GameResponse
```typescript
{
  id: number;
  board_number: number;
  white_player_id: number;
  black_player_id: number;
  result: "pending" | "white_win" | "black_win" | "draw";
  white_score: number;
  black_score: number;
  is_completed: boolean;
}
```

### StandingsResponse
```typescript
{
  standings: Array<{
    team_id: number;
    team_name: string;
    group: number;
    matches_played: number;
    wins: number;
    draws: number;
    losses: number;
    match_points: number;
    game_points: number;
    sonneborn_berger: number;
    manual_tb4: number;
  }>;
}
```

### BestPlayersResponse
```typescript
{
  players: Array<{
    player_id: number;
    player_name: string;
    games_played: number;
    wins: number;
    draws: number;
    losses: number;
    points: number;
    tb3: number;
  }>;
}
```

---

## 3. Business Logic Notes

### Tournament Flow
1. **Creation**: Tournaments are created with teams and players automatically generated
2. **Starting**: The `/start` endpoint generates initial pairings based on tournament format
3. **Rounds**: Each round must be completed before the next can begin
4. **Validation**: Standings and best players must be validated to progress tournament stages
5. **Tiebreakers**: Manual tiebreaker resolution is available for tied positions

### Player/Team Constraints
- Teams must have exactly 4 players initially
- Teams must have at least 4 players (cannot delete below this limit)
- Player names must be unique within a team
- Team names must be unique within a tournament
- Players assigned to games cannot be deleted without reassignment

### Match Rules
- Each match consists of 4 games (one per board)
- Game results: 1 point for win, 0.5 for draw, 0 for loss
- Match results determined by total game points
- Tiebreakers available for drawn matches in knockout stages
- Color swapping only allowed in knockout matches

### Scoring System
- **Match Points**: 2 for match win, 1 for draw, 0 for loss
- **Game Points**: Sum of individual game scores
- **Sonneborn-Berger**: Tiebreaker based on opponents' scores
- **Manual Tiebreakers**: Additional manual ranking for tied positions

### Data Integrity
- Cascading deletes: Tournament deletion removes all related data
- Foreign key constraints ensure referential integrity
- Automatic timestamp tracking for audit trails
- Statistics automatically recalculated when results change

---

## 4. Error Responses

### Common HTTP Status Codes
- `200 OK`: Successful request
- `400 Bad Request`: Invalid request data or business rule violation
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Requested resource doesn't exist
- `409 Conflict`: Duplicate data constraint violation
- `500 Internal Server Error`: Unexpected server error

### Error Response Format
```json
{
  "detail": "Error message describing what went wrong"
}
```

### Common Error Messages
- `"Invalid username or password"` - Authentication failed
- `"Token expired"` - JWT token has expired
- `"Tournament not found"` - Invalid tournament ID
- `"Team name already exists in the target tournament"` - Duplicate team name
- `"Player name already exists in the same team"` - Duplicate player name
- `"Team must have at least 4 players"` - Minimum player constraint
- `"Cannot delete player - assigned to X game(s)"` - Player deletion blocked
- `"Round X not found for tournament Y"` - Invalid round reference
- `"No standings ties found"` - Tiebreaker not applicable
- `"Group stage is not completed"` - Premature validation attempt

---

## 5. Authentication & Authorization

### Authentication Method
- **Type**: JWT (JSON Web Tokens)
- **Header**: `Authorization: Bearer <token>`
- **Algorithm**: HS256
- **Expiry**: 60 minutes
- **Secret**: Configurable via `JWT_SECRET` environment variable

### Token Structure
```json
{
  "sub": "username",
  "iat": 1640995200,
  "exp": 1640998800
}
```

### Protected Endpoints
All `POST`, `PUT`, and `DELETE` operations require authentication:

#### Tournament Management
- Creating tournaments
- Updating tournament details
- Deleting tournaments
- Starting tournaments
- Completing rounds
- Manual tiebreaker resolution
- Validating standings/best players

#### Team/Player Management
- Updating team names
- Creating/updating/deleting players

#### Match Management
- Submitting game results
- Tiebreaker results
- Player swapping
- Color swapping

### Public Endpoints (No Authentication Required)
- Getting tournaments, teams, players, matches
- Viewing standings and best players
- Checking for ties
- Authentication endpoints (`/login`, `/verify`)

### Environment Variables
```bash
# Authentication
ADMIN_USERNAME=admin          # Default admin username
ADMIN_PASSWORD=secret         # Default admin password
JWT_SECRET=supersecretkey     # JWT signing secret

# Application
DEBUG=false                   # Enable/disable debug mode
ALLOWED_HOSTS=localhost       # Comma-separated allowed hosts
ALLOWED_ORIGINS=http://localhost:3000  # Comma-separated CORS origins
```

### Security Notes
- Passwords are compared in plain text (development setup)
- JWT tokens include user identification and expiry
- All admin operations require valid authentication
- CORS is configurable for frontend integration
- Debug mode enables automatic API documentation at `/docs`

---

## Development Notes

### Database Models
The system uses SQLAlchemy ORM with PostgreSQL, featuring:
- Automatic primary keys and timestamps
- Cascading deletes for data integrity
- Enum types for controlled values
- Foreign key relationships with proper indexing

### API Design Patterns
- RESTful endpoints with standard HTTP methods
- Consistent JSON request/response format
- Proper HTTP status codes
- Pagination support where applicable
- Error handling with descriptive messages

### Business Logic Separation
Tournament-specific logic is isolated in `utilities/tournament.py`:
- Pairing algorithms for different formats
- Statistics calculation and validation
- Round completion and progression logic
- Tiebreaker resolution mechanisms
