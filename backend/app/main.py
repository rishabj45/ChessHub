### backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.cors import CORSMiddleware
import os, logging
from .database import engine, Base
from .api import tournaments, teams, players, matches,auth
from dotenv import load_dotenv; load_dotenv()

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
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if not DEBUG:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=ALLOWED_HOSTS)

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

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/")
def root():
    return {"message": "Chess Tournament API", "version": API_VERSION}
