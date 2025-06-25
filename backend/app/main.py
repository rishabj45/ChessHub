### backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.cors import CORSMiddleware
import os, logging
from .database import engine, Base
from .api import tournaments, teams, players, matches,auth
from dotenv import load_dotenv; load_dotenv()
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DEBUG = os.getenv("DEBUG", "false").lower() == "true"
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "localhost").split(",")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",")
API_VERSION = "v1"

app = FastAPI(
    title="Chess Tournament Management System",
    version=API_VERSION,
    docs_url="/docs" if DEBUG else None
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ✅ Allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
if not DEBUG:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

@app.on_event("startup")
def on_startup():
    logger.info("🚀 Starting up")
    Base.metadata.create_all(bind=engine)
    logger.info("✅ Tables ready")

@app.on_event("shutdown")
def on_shutdown():
    logger.info("🛑 Shutting down")


app.include_router(auth.router)
app.include_router(tournaments.router)
app.include_router(teams.router)
app.include_router(players.router)
app.include_router(matches.router)

# At bottom of main.py, after routers:
frontend_path = os.path.join(os.path.dirname(__file__), "../../frontend/dist")
app.mount("/", StaticFiles(directory=frontend_path, html=True), name="static")

# Optional: fallback to index.html (React Router)
@app.get("/{full_path:path}")
def spa_fallback():
    return FileResponse(os.path.join(frontend_path, "index.html"))
