from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.db.session import engine


app = FastAPI(
    title="InvestigaTec API",
    description="Sistema de gestion y revision de proyectos del Cuerpo Academico",
    version="2.0.0"
)

origins = [
    origin.strip()
    for origin in settings.cors_origins.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.get("/")
def root():
    return {
        "mensaje": "Bienvenido a InvestigaTec API",
        "version": "2.0.0"
    }


@app.get("/health")
def health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "api": "ok",
            "database": "connected"
        }

    except SQLAlchemyError:
        return {
            "api": "ok",
            "database": "disconnected"
        }