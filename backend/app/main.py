### backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.cors import CORSMiddleware
import os, logging
from contextlib import asynccontextmanager
from .database import engine, Base
from .api import tournaments, teams, players, matches, auth, announcements
from dotenv import load_dotenv; load_dotenv()
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DEBUG = os.getenv("DEBUG", "false").lower() == "true"
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "").split(",")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",")
API_VERSION = "v1"

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 Starting up")
    Base.metadata.create_all(bind=engine)
    logger.info("✅ Tables ready")
    yield
    # Shutdown
    logger.info("🛑 Shutting down")

app = FastAPI(
    title="Chess Tournament Management System",
    version=API_VERSION,
    docs_url="/docs" if DEBUG else None,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
if not DEBUG:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=ALLOWED_HOSTS)

app.include_router(auth.router)
app.include_router(tournaments.router)
app.include_router(teams.router)
app.include_router(players.router)
app.include_router(matches.router)
app.include_router(announcements.router)

frontend_path = os.path.join(os.path.dirname(__file__), "../../frontend/dist")
app.mount("/", StaticFiles(directory=frontend_path, html=True), name="static")

@app.get("/{full_path:path}")
def spa_fallback():
    return FileResponse(os.path.join(frontend_path, "index.html"))