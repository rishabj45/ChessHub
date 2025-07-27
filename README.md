# ChessHub ♟️

A comprehensive chess tournament management system built with FastAPI and React. Supports both round-robin and group+knockout tournament formats with advanced team and player management capabilities.

## ✨ Features

### 🏆 Tournament Management
- **Multiple Formats**: Round-robin and group+knockout tournaments
- **Smart Scheduling**: Automated round generation with fair color allocation
- **Stage Progression**: Automatic advancement through group, semifinal, and final stages
- **Manual Controls**: Admin override for round completion and tournament flow

### 👥 Team & Player Management
- **Team Creation**: Support for 4-6 players per team with flexible roster management
- **Player Ratings**: ELO rating system with automatic board assignments
- **Role Management**: Team captains and position assignments

### 📊 Advanced Scoring
- **Multiple Tiebreakers**: FIDE Sonneborn-Berger system implementation
- **Real-time Standings**: Live tournament rankings and statistics
- **Match Tracking**: Individual game results within team matches
- **Performance Analytics**: Player win/loss records and rating changes

### 🔐 Security & Access Control
- **Admin Authentication**: JWT-based secure admin access
- **Toggle Mode**: Switch between viewer and admin interfaces
- **Protected Operations**: Tournament creation and management restricted to admins

### 💻 Modern Interface
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Real-time Updates**: Automatic refresh of scores and standings
- **Intuitive Navigation**: Clean, tabbed interface with modern styling
- **Progressive Web App**: Optimized for performance and usability

## 🚀 Quick Start

### Prerequisites
- **Python 3.8+**
- **Node.js 16+** 
- **npm or yarn**

### Backend Setup

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Create and activate virtual environment:**
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux  
source venv/bin/activate
```

3. **Install Python dependencies:**
```bash
pip install -r requirements.txt
```

4. **Initialize the database:**
```bash
alembic upgrade head
```

5. **Start the backend server:**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000` with API documentation at `http://localhost:8000/docs`

### Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start development server:**
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 🏗️ Architecture

### Backend (FastAPI)
- **FastAPI Framework**: Modern, fast web framework with automatic API documentation
- **SQLAlchemy ORM**: Robust database abstraction with relationship management  
- **Alembic Migrations**: Database schema versioning and migration management
- **JWT Authentication**: Stateless admin authentication system
- **Modular Design**: Clean separation of concerns with organized API routes

### Frontend (React + TypeScript)
- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Type-safe development with enhanced IDE support
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework for rapid styling
- **React Query**: Efficient data fetching and caching
- **React Router**: Client-side routing for SPA navigation

### Database Schema
- **Tournament**: Main tournament configuration and state
- **Team**: Team information with 4-6 players each
- **Player**: Individual player data with ratings and statistics
- **Round**: Tournament round organization and completion tracking
- **Match**: Team vs team matches with scoring
- **Game**: Individual board games within team matches

## 📚 API Reference

### Authentication
- `POST /api/auth/login` - Admin login with credentials
- `POST /api/auth/verify` - Verify JWT token validity

### Tournament Management
- `GET /api/tournaments/current` - Get active tournament
- `POST /api/tournaments/` - Create new tournament (admin)
- `PUT /api/tournaments/{id}` - Update tournament settings (admin)
- `POST /api/tournaments/{id}/start` - Start tournament (admin)
- `POST /api/tournaments/{id}/complete` - Complete tournament (admin)
- `GET /api/tournaments/{id}/can-complete` - Check completion eligibility

### Round Management
- `GET /api/tournaments/{id}/rounds/{round}/can-complete` - Check round completion
- `POST /api/tournaments/{id}/rounds/{round}/complete` - Complete round manually (admin)

### Standings & Rankings
- `GET /api/tournaments/{id}/standings` - Team standings (group stage)
- `GET /api/tournaments/{id}/group-standings` - Group standings (group+knockout format)
- `GET /api/tournaments/{id}/final-rankings` - Final top 3 rankings (completed tournaments)

### Team Management
- `GET /api/teams/` - List all teams
- `POST /api/teams/` - Create team (admin)
- `PUT /api/teams/{id}` - Update team (admin)
- `DELETE /api/teams/{id}` - Delete team (admin)

### Player Management
- `GET /api/players/` - List all players
- `POST /api/players/` - Create player (admin)
- `PUT /api/players/{id}` - Update player (admin)
- `DELETE /api/players/{id}` - Delete player (admin)

### Match Management
- `GET /api/matches/` - List all matches
- `PUT /api/matches/{id}/result` - Submit match result (admin)

## 🎯 Tournament Formats

### Round-Robin
- All teams play against each other once
- Standings based on match points with Sonneborn-Berger tiebreaker
- Single stage from start to finish

### Group + Knockout
- **Group Stage**: Teams divided into groups, round-robin within groups
- **Semifinal Stage**: Top 2 from each group (A1 vs B2, A2 vs B1)
- **Final Stage**: Winner's final + 3rd place playoff
- **Auto-advancement**: Automatic progression between stages when rounds complete

## 🔧 Advanced Features

### Tournament Logic
- **Fair Color Distribution**: Ensures balanced white/black game allocation
- **Smart Board Assignment**: Top 4 players by rating with substitution logic
- **Multiple Tiebreakers**: Match points → Game points → Sonneborn-Berger → Head-to-head
- **Manual Override**: Admin control over round completion and tournament flow

### Scoring System
- **Match Points**: 1 for win, 0.5 for draw, 0 for loss
- **Game Points**: Sum of individual game results
- **Sonneborn-Berger**: FIDE standard tiebreaker calculation
- **Real-time Updates**: Automatic recalculation on result changes

### User Experience
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Progressive Loading**: Optimistic UI updates with error handling
- **Admin Toggle**: Seamless switching between viewer and admin modes
- **Real-time Sync**: Automatic data refresh and state management

## 🛠️ Development

### Project Structure
```
ChessHub/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API route modules
│   │   ├── models.py       # SQLAlchemy models
│   │   ├── schemas.py      # Pydantic schemas
│   │   ├── crud.py         # Database operations
│   │   ├── tournament_logic.py  # Tournament algorithms
│   │   └── main.py         # FastAPI app entry point
│   ├── alembic/            # Database migrations
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API service layer
│   │   ├── types/          # TypeScript definitions
│   │   └── utils/          # Utility functions
│   └── package.json        # Node.js dependencies
└── README.md
```

### Running Tests
```bash
# Backend tests
cd backend
python -m pytest tests/

# Frontend tests  
cd frontend
npm run test
```

### Database Migrations
```bash
cd backend
# Create new migration
alembic revision --autogenerate -m "Description of changes"
# Apply migrations
alembic upgrade head
```

## 🚀 Deployment

### Production Setup
1. Set environment variables for production
2. Build frontend: `npm run build`
3. Configure reverse proxy (nginx/Apache)
4. Use production WSGI server (gunicorn/uvicorn)
5. Set up SSL certificates

### Environment Variables
```bash
# Backend
DATABASE_URL=sqlite:///./chess_tournament.db
SECRET_KEY=your-secret-key-here
DEBUG=false
ALLOWED_HOSTS=your-domain.com

# Frontend  
VITE_API_URL=https://your-api-domain.com
```


## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

