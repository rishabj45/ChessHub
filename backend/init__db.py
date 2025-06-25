### backend/init_db.py
#!/usr/bin/env python3
"""
Database initialization script with sample data.
"""

import sys
from pathlib import Path
from datetime import datetime, timedelta ,UTC
import os
from app import schemas 

backend_dir = Path(__file__).parent.resolve()
app_dir = backend_dir / "app"
sys.path.insert(0, str(backend_dir))
sys.path.insert(0, str(app_dir))

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

load_dotenv(backend_dir / ".env")

raw_url = os.getenv("DATABASE_URL", "sqlite:///./chess_tournament.db")
DATABASE_URL = raw_url.replace("sqlite+aiosqlite://", "sqlite://", 1)

engine = create_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)

from app.tournament_logic import create_tournament_structure
from app.database import Base

def main():
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created")
    n=6  # Number of teams to create
    session = SessionLocal()
    try:
        team_names = [f"Team {i+1}" for i in range(n)]
        players_per_team = [4]*n
        data = {
            "name": "Sample Tournament",
            "description": "Auto-generated",
            "start_date": datetime.now(UTC),
            "end_date": datetime.now(UTC) + timedelta(days=1),
            "team_names": team_names,
            "players_per_team": players_per_team
        }
        pydantic_data = schemas.TournamentCreate(**data)
        tour = create_tournament_structure(session, pydantic_data)
        session.commit()
        print(f"Created tournament: {tour.name}")
    except Exception as e:
        session.rollback()
        print(f"❌ Init failed: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    main()
