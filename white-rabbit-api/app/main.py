"""
White Rabbit OS™ — Backend API
Operational Intelligence Platform for Nordic SMBs
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.db.database import create_tables
from app.routers.prospects import router as prospects_router
from app.routers.ai import router as ai_router
from app.routers.activities import router as activities_router, tasks_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup (use Alembic in production)
    await create_tables()
    yield


app = FastAPI(
    title="White Rabbit OS™ API",
    description="Operational Intelligence Platform for Nordic SMBs",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(prospects_router)
app.include_router(ai_router)
app.include_router(activities_router)
app.include_router(tasks_router)


@app.get("/", tags=["health"])
async def root():
    return {
        "product": "White Rabbit OS™",
        "status":  "operational",
        "version": "0.1.0",
    }


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}
