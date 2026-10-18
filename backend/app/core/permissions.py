from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.auth import obtener_usuario_actual
from app.db.session import get_db
from app.models.usuario import Usuario
from app.models.rol import Rol, UsuarioRol


def tiene_rol(
    db: Session,
    id_usuario: int,
    nombre_rol: str,
) -> bool:
    consulta = (
        select(UsuarioRol.id_usuario)
        .join(Rol, UsuarioRol.id_rol == Rol.id_rol)
        .where(
            UsuarioRol.id_usuario == id_usuario,
            Rol.nombre == nombre_rol,
        )
    )

    return db.scalar(consulta) is not None


def requerir_admin(
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
) -> Usuario:

    if not tiene_rol(db, usuario.id_usuario, "ADMIN"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren permisos de administrador",
        )

    return usuario


def requerir_revisor(
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
) -> Usuario:
    if not tiene_rol(db, usuario.id_usuario, "REVISOR"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren permisos de revisor",
        )

    return usuario
