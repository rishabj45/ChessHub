# ChessHub 🏆♟️

A comprehensive Chess Tournament Management System built with **FastAPI** and **React**, designed to organize and manage chess tournaments with team-based competitions, advanced scoring systems, and real-time tournament tracking.

## 🌟 Features

### 🎯 Tournament Management
- **Multiple Tournament Formats**: Round Robin, Group + Knockout
- **Real-time Tournament Tracking**: Live updates of match results and standings
- **Advanced Tiebreaker System**: Sonneborn-Berger scoring and manual tiebreaker resolution
- **Tournament Stages**: Group stage, Semi-finals, Finals with automatic progression
- **Match Scheduling**: Automated pairing generation and round management

### 👥 Team & Player Management
- **Team-based Competition**: 4-player teams with automatic player assignment
- **Player Rating System**: Integrated rating tracking and management
- **Flexible Team Editing**: Add, remove, and modify players and teams
- **Captain Assignment**: Designate team captains for each team

### 📊 Advanced Scoring & Analytics
- **Comprehensive Scoring**: Match points, game points, and Sonneborn-Berger calculations
- **Live Standings**: Real-time tournament standings with detailed statistics
- **Best Players Ranking**: Individual player performance tracking
- **Match Statistics**: Win/loss/draw ratios and performance metrics

### 🎮 Game Management
- **Board-level Results**: Track individual game results on 4 boards per match
- **Match Validation**: Ensure data integrity and result accuracy
- **Color Assignment**: Automatic white/black piece assignment with swapping rules
- **Tiebreaker Matches**: Support for tiebreaker games in knockout stages

### 📢 Communication & Administration
- **Tournament Announcements**: Admin-controlled announcement system
- **Role-based Access**: Admin and user roles with appropriate permissions
- **JWT Authentication**: Secure login and session management
- **Real-time Updates**: Live data synchronization across all connected clients

## 🛠️ Technology Stack

### Backend
- **FastAPI** - Modern, fast Python web framework with automatic API documentation
- **SQLAlchemy** - Advanced ORM with PostgreSQL integration
- **Alembic** - Database migration management
- **PyJWT** - JWT token authentication
- **Pydantic** - Data validation and serialization
- **PostgreSQL** - Robust relational database for tournament data

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe JavaScript for better development experience
- **React Router** - Client-side routing and navigation
- **Axios** - HTTP client for API communication
- **React Query** - Server state management and caching
- **Tailwind CSS** - Utility-first CSS framework for responsive design
- **Lucide React** - Beautiful icon library
- **Vite** - Fast build tool and development server

### Development Tools
- **ESLint** - Code linting and style enforcement
- **Autoprefixer** - CSS vendor prefixing
- **PostCSS** - CSS processing and optimization

## 🚀 Quick Start

### Prerequisites
- **Python 3.8+**
- **Node.js 16+**
- **PostgreSQL 12+**

## 📚 API Documentation

The backend provides comprehensive RESTful APIs with automatic OpenAPI documentation available at `/docs` when running in development mode.

### Key Endpoints
- **Tournaments**: CRUD operations, start/complete tournaments, standings
- **Teams**: Team management, player assignments
- **Matches**: Result updates, tiebreaker resolution
- **Players**: Player statistics and performance tracking
- **Authentication**: JWT-based login and user management

## 🏗️ Project Structure

```
ChessHub/
├── backend/
│   ├── app/
│   │   ├── api/           # API route handlers
│   │   ├── utilities/     # Business logic and algorithms
│   │   ├── models.py      # SQLAlchemy database models
│   │   ├── schemas.py     # Pydantic request/response schemas
│   │   ├── crud.py        # Database operations
│   │   └── main.py        # FastAPI application setup
│   ├── alembic/           # Database migration files
│   └── requirements.txt   # Python dependencies
└── frontend/
    ├── src/
    │   ├── components/    # React components
    │   ├── hooks/         # Custom React hooks
    │   ├── services/      # API service layer
    │   ├── types/         # TypeScript type definitions
    │   └── utils/         # Utility functions
    ├── package.json       # Node.js dependencies
    └── vite.config.ts     # Vite configuration
```

## 🎯 Key Features Deep Dive

### Tournament Creation
- Support for various tournament formats
- Automatic team and player generation
- Configurable group stages and knockout rounds

### Intelligent Pairing System
- Round-robin pairings within groups
- Elimination bracket generation
- Color balancing and fairness algorithms

### Advanced Scoring
- Multiple scoring metrics (match points, game points, Sonneborn-Berger)
- Automatic tiebreaker calculation
- Manual tiebreaker resolution for edge cases

### Real-time Updates
- Live match result updates
- Instant standings recalculation
- Tournament progress tracking

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Admin and user permission levels
- **CORS Protection**: Configurable cross-origin request handling
- **Input Validation**: Comprehensive request validation using Pydantic
- **SQL Injection Prevention**: ORM-based database queries

## 📱 Responsive Design

The frontend is fully responsive and optimized for:
- **Desktop**: Full feature access with optimal layout
- **Tablet**: Touch-friendly interface with maintained functionality
- **Mobile**: Streamlined experience for tournament viewing

## 🧪 Testing & Quality

- **Database Migrations**: Alembic-managed schema evolution
- **Type Safety**: Full TypeScript implementation
- **Code Quality**: ESLint configuration for consistent code style
- **API Documentation**: Auto-generated OpenAPI specifications

## 🚀 Deployment

### Production Considerations
- **Database**: PostgreSQL with proper indexing and constraints
- **Environment Variables**: Secure configuration management
- **CORS**: Proper origin configuration for production domains
- **Static Files**: Optimized frontend build for production serving

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Rishab Jain**
- GitHub: [@rishabj45](https://github.com/rishabj45)

## 🙏 Acknowledgments

- Chess tournament organizers for real-world requirements and feedback
- Open source community for excellent libraries and tools
- Chess federation rules and regulations for scoring system implementation

---
