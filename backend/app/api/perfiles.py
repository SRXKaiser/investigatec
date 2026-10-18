from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.usuario import Usuario
from app.models.perfil import Perfil
from app.api.auth import obtener_usuario_actual
from app.schemas.perfil import PerfilActualizar, PerfilRespuesta


router = APIRouter(
    prefix="/perfiles",
    tags=["Perfiles académicos"]
)


@router.get("/me", response_model=PerfilRespuesta)
def obtener_mi_perfil(
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    perfil = db.scalar(
        select(Perfil).where(
            Perfil.id_usuario == usuario.id_usuario
        )
    )

    if perfil is None:
        raise HTTPException(
            status_code=404,
            detail="El usuario todavía no tiene un perfil"
        )

    return perfil


@router.patch("/me", response_model=PerfilRespuesta)
def actualizar_mi_perfil(
    datos: PerfilActualizar,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    perfil = db.scalar(
        select(Perfil).where(
            Perfil.id_usuario == usuario.id_usuario
        )
    )

    if perfil is None:
        raise HTTPException(
            status_code=404,
            detail="El usuario todavía no tiene un perfil"
        )

    cambios = datos.model_dump(exclude_unset=True)

    for campo, valor in cambios.items():
        setattr(perfil, campo, valor)

    db.commit()
    db.refresh(perfil)

    return perfil