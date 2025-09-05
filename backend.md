# ChessHub Backend Documentation

## Overview
FastAPI-based backend for Chess Tournament Management System with PostgreSQL database, JWT authentication, and comprehensive tournament management features.

## Architecture

### Core Technologies
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **Alembic** - Database migrations
- **PostgreSQL** - Primary database
- **PyJWT** - JWT token authentication
- **Pydantic** - Data validation and serialization

### Project Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application setup
│   ├── database.py          # Database configuration
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── crud.py              # Database operations
│   ├── enums.py             # Enum definitions
│   ├── api/                 # API route handlers
│   │   ├── auth.py          # Authentication endpoints
│   │   ├── tournaments.py   # Tournament management
│   │   ├── teams.py         # Team operations
│   │   ├── players.py       # Player management
│   │   ├── matches.py       # Match operations
│   │   └── announcements.py # Announcement system
│   └── utilities/           # Business logic
│       ├── auth.py          # Authentication utilities
│       └── tournament.py    # Tournament algorithms
├── alembic/                 # Database migrations
├── requirements.txt         # Python dependencies
└── .env                     # Environment variables
```

## Database Models

### Tournament
- Primary entity for tournament management
- Supports multiple formats: Round Robin, Group+Knockout, Swiss
- Tracks current stage and round progression
- Validation flags for standings and best players

### Team
- 4-player teams with group assignments
- Automatic statistics calculation (wins, draws, losses)
- Sonneborn-Berger scoring for tiebreakers
- Manual tiebreaker support

### Player
- Individual players with ratings
- Team assignment and board positions
- Performance tracking across games

### Match
- Team vs team competitions
- 4 games per match (one per board)
- Support for knockout stage tiebreakers
- Automatic score calculation

### Game
- Individual board games within matches
- Player assignments and results
- Score tracking (1.0, 0.5, 0.0)

## API Endpoints

### Authentication
- `POST /auth/login` - User login with JWT
- `POST /auth/register` - User registration
- `GET /auth/me` - Current user info

### Tournaments
- `GET /tournaments/current` - Current active tournament
- `POST /tournaments/` - Create new tournament
- `PUT /tournaments/{id}` - Update tournament
- `POST /tournaments/{id}/start` - Start tournament
- `GET /tournaments/{id}/standings` - Team standings
- `GET /tournaments/{id}/best-players` - Player rankings

### Teams
- `GET /teams/` - List teams for tournament
- `POST /teams/` - Create team
- `PUT /teams/{id}` - Update team
- `DELETE /teams/{id}` - Delete team

### Players
- `GET /players/` - List players
- `POST /players/` - Create player
- `PUT /players/{id}` - Update player
- `DELETE /players/{id}` - Delete player

### Matches
- `GET /matches/` - List matches
- `PUT /matches/{id}` - Update match results
- `POST /matches/{id}/complete` - Complete match

## Business Logic

### Tournament Creation
1. Create tournament with teams
2. Auto-generate 4 players per team
3. Create round-robin or group stage structure
4. Generate knockout rounds if applicable

### Pairing System
- Round-robin within groups
- Knockout bracket generation
- Color balancing for fairness
- Bye handling for odd numbers

### Scoring System
- **Match Points**: 2 for win, 1 for draw, 0 for loss
- **Game Points**: Sum of individual game scores
- **Sonneborn-Berger**: Opponent score tiebreaker
- **Manual Tiebreakers**: Admin-controlled rankings

### Tournament Progression
1. Group stage completion
2. Standings validation
3. Knockout stage generation
4. Final rankings and best players

## Environment Configuration

### Required Variables
```env
DATABASE_URL=postgresql://user:pass@host:port/database
SECRET_KEY=your-jwt-secret-key
DEBUG=true/false
ALLOWED_HOSTS=localhost,domain.com
ALLOWED_ORIGINS=http://localhost:3000
```

### Optional Variables
```env
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
LOG_LEVEL=INFO
```

## Development Workflow

### Database Operations
```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

### Running the Server
```bash
# Development
uvicorn app.main:app --reload

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Key Features to Extend

### Tournament Formats
- Add Swiss system implementation
- Custom round structures
- Multiple group configurations

### Advanced Features
- ELO rating calculations
- Player statistics tracking
- Tournament analytics
- Export functionality

### Performance Optimizations
- Database query optimization
- Caching strategies
- Background task processing
- Real-time updates with WebSockets

## Testing

### Unit Tests
- Model validation tests
- CRUD operation tests
- Business logic tests
- API endpoint tests

### Integration Tests
- Tournament workflow tests
- Authentication flow tests
- Database transaction tests

## Security Considerations

### Authentication
- JWT token validation
- Role-based access control
- Session management
- Password hashing

### Data Protection
- Input validation
- SQL injection prevention
- CORS configuration
- Environment variable security

## Deployment

### Production Setup
- PostgreSQL database
- Environment variables
- SSL certificates
- Reverse proxy (Nginx)
- Process management (Gunicorn/Uvicorn)

### Docker Configuration
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0"]
```

## Common Operations

### Adding New Endpoints
1. Create schema in `schemas.py`
2. Add CRUD operations in `crud.py`
3. Implement route in appropriate API module
4. Update documentation

### Database Schema Changes
1. Modify models in `models.py`
2. Generate migration with Alembic
3. Test migration on development database
4. Apply to production

### Adding Business Logic
1. Implement in `utilities/` modules
2. Add unit tests
3. Integrate with API endpoints
4. Update documentation

## Troubleshooting

### Common Issues
- Database connection errors
- Migration conflicts
- Authentication failures
- CORS configuration problems

### Debugging Tools
- FastAPI automatic docs (`/docs`)
- Database query logging
- Application logging
- Error tracking

## Performance Monitoring

### Metrics to Track
- Response times
- Database query performance
- Memory usage
- Error rates
- Active tournaments

### Optimization Strategies
- Database indexing
- Query optimization
- Connection pooling
- Caching implementation
