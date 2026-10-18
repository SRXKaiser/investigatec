from datetime import datetime, timezone

import jwt

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)
from app.db.session import get_db
from app.models.usuario import Usuario
from app.models.perfil import Perfil
from app.schemas.auth import (
    UsuarioRegistro,
    UsuarioLogin,
    UsuarioRespuesta,
    TokenRespuesta,
)
from app.models.rol import Rol, UsuarioRol


router = APIRouter(prefix="/auth", tags=["Autenticación"])

bearer_scheme = HTTPBearer(auto_error=False)


@router.post(
    "/register",
    response_model=UsuarioRespuesta,
    status_code=status.HTTP_201_CREATED,
)
def registrar_usuario(
    datos: UsuarioRegistro,
    db: Session = Depends(get_db),
):
    correo = str(datos.correo).lower()

    usuario_existente = db.scalar(
        select(Usuario).where(Usuario.correo == correo)
    )

    if usuario_existente:
        raise HTTPException(
            status_code=409,
            detail="El correo electrónico ya está registrado",
        )

    nuevo_usuario = Usuario(
        nombre=datos.nombre.strip(),
        apellido_paterno=datos.apellido_paterno.strip(),
        apellido_materno=(
            datos.apellido_materno.strip()
            if datos.apellido_materno
            else None
        ),
        correo=correo,
        password_hash=hash_password(datos.password),
        activo=True,
    )

    db.add(nuevo_usuario)

    # Guardar temporalmente para obtener su ID
    db.flush()

    # Crear un username unico basado en el ID del usuario
    username = f"investigador{nuevo_usuario.id_usuario}"

    # Crear automaticamente el perfil
    nuevo_perfil = Perfil(
        id_usuario=nuevo_usuario.id_usuario,
        username=username,
        nombre_publico=(
            f"{nuevo_usuario.nombre} "
            f"{nuevo_usuario.apellido_paterno}"
        ),
        perfil_visible=True,
    )

    db.add(nuevo_perfil)
    rol_miembro = db.scalar(
        select(Rol).where(Rol.nombre == "MIEMBRO")
    )

    if rol_miembro is None:
        raise HTTPException(
            status_code=503,
            detail="El catálogo de roles no está inicializado",
        )

    db.add(
        UsuarioRol(
            id_usuario=nuevo_usuario.id_usuario,
            id_rol=rol_miembro.id_rol,
        )
)

    # Guardar usuario y perfil en una misma transaccion
    db.commit()
    db.refresh(nuevo_usuario)

    return nuevo_usuario


@router.post("/login", response_model=TokenRespuesta)
def iniciar_sesion(
    datos: UsuarioLogin,
    db: Session = Depends(get_db),
):
    correo = str(datos.correo).lower()

    usuario = db.scalar(
        select(Usuario).where(Usuario.correo == correo)
    )

    if (
        usuario is None
        or not verify_password(
            datos.password,
            usuario.password_hash,
        )
    ):
        raise HTTPException(
            status_code=401,
            detail="Correo o contraseña incorrectos",
        )

    if not usuario.activo:
        raise HTTPException(
            status_code=403,
            detail="La cuenta está desactivada",
        )

    usuario.ultimo_acceso = datetime.now(timezone.utc)
    db.commit()

    token = create_access_token(usuario.id_usuario)

    return TokenRespuesta(access_token=token)


def obtener_usuario_actual(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    ),
    db: Session = Depends(get_db),
) -> Usuario:

    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="No se proporcionó un token de autenticación",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_access_token(credentials.credentials)

        if payload.get("type") != "access":
            raise ValueError("Tipo de token inválido")

        user_id = int(payload["sub"])

    except (jwt.InvalidTokenError, ValueError, KeyError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    usuario = db.get(Usuario, user_id)

    if usuario is None or not usuario.activo:
        raise HTTPException(
            status_code=401,
            detail="Usuario no autorizado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return usuario


@router.get("/me", response_model=UsuarioRespuesta)
def consultar_mi_usuario(
    usuario: Usuario = Depends(obtener_usuario_actual),
):
    return usuario