from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.auth import obtener_usuario_actual
from app.db.session import get_db
from app.models.usuario import Usuario
from app.models.rol import Rol
from app.schemas.administracion import RolRespuesta
from app.services.administracion import roles_de_usuario


router = APIRouter(prefix="/roles", tags=["Roles"])


@router.get("", response_model=list[RolRespuesta])
def listar_roles(
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    return db.scalars(
        select(Rol).order_by(Rol.nombre)
    ).all()


@router.get("/me", response_model=list[RolRespuesta])
def consultar_mis_roles(
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    return roles_de_usuario(db, usuario.id_usuario)