"""Pruebas de API sin PostgreSQL externo; base temporal SQLite aislada.

En producción se mantiene PostgreSQL. Estas pruebas no reemplazan la prueba
integrada con Docker, pero verifican rutas, permisos y lógica básica.
"""

import os

os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "clave-de-pruebas-no-utilizar-en-produccion-1234")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401 - registra todas las tablas
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.rol import Rol


@pytest.fixture
def session_factory():
    engine = create_engine(
        "sqlite+pysqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False)
    with factory() as db:
        for nombre in ("MIEMBRO", "REVISOR", "ADMIN"):
            db.add(Rol(nombre=nombre, descripcion=nombre))
        db.commit()
    yield factory
    engine.dispose()


@pytest.fixture
def client(session_factory):
    def override_get_db():
        with session_factory() as db:
            yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as browser:
        yield browser
    app.dependency_overrides.clear()


@pytest.fixture
def usuario(client):
    datos = {
        "nombre": "Ana",
        "apellido_paterno": "Pruebas",
        "correo": "ana@example.org",
        "password": "PasswordSeguro123!",
    }
    respuesta = client.post("/auth/register", json=datos)
    assert respuesta.status_code == 201, respuesta.text
    login = client.post(
        "/auth/login",
        json={"correo": datos["correo"], "password": datos["password"]},
    )
    assert login.status_code == 200
    return {
        "id": respuesta.json()["id_usuario"],
        "headers": {"Authorization": f"Bearer {login.json()['access_token']}"},
        "datos": datos,
    }
