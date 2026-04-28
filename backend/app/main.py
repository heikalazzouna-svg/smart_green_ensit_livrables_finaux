"""SMART GREEN ENSIT FastAPI application."""

from __future__ import annotations

import logging

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.api import admin, auth, calculations, dashboard, data, simulations
from app.db.base import Base
from app.db.session import engine
from app.seed import seed_database

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SMART GREEN ENSIT API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost",
        "http://frontend:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup() -> None:
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    seed_database()


app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(data.router, prefix="/api/data", tags=["data"])
app.include_router(calculations.router, prefix="/api/calculations", tags=["calculations"])
app.include_router(simulations.router, prefix="/api/simulations", tags=["simulations"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])


@app.get("/")
def root() -> dict[str, str]:
    return {"status": "ok", "service": "SMART GREEN ENSIT API"}


@app.exception_handler(RequestValidationError)
async def validation_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Données invalides", "errors": exc.errors()},
    )


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_handler(_: Request, exc: SQLAlchemyError) -> JSONResponse:
    logger.exception("SQLAlchemy error", exc_info=exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Erreur base de données"},
    )


@app.exception_handler(404)
async def not_found_handler(request: Request, _: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": "Ressource non trouvée", "path": request.url.path},
    )


@app.exception_handler(500)
async def internal_handler(_: Request, exc: Exception) -> JSONResponse:
    logger.exception("Internal server error", exc_info=exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Erreur interne du serveur"},
    )
