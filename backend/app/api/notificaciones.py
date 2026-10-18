
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.auth import obtener_usuario_actual
from app.db.session import get_db
from app.models.usuario import Usuario
from app.models.notificacion import Notificacion
from app.schemas.notificacion import NotificacionRespuesta


router = APIRouter(
    prefix="/notificaciones",
    tags=["Notificaciones"],
)


@router.get(
    "/",
    response_model=list[NotificacionRespuesta],
)
def mis_notificaciones(
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    return db.scalars(
        select(Notificacion)
        .where(Notificacion.id_usuario == usuario.id_usuario)
        .order_by(Notificacion.fecha_creacion.desc())
    ).all()


@router.get("/no-leidas/total")
def total_no_leidas(
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    notificaciones = db.scalars(
        select(Notificacion.id_notificacion).where(
            Notificacion.id_usuario == usuario.id_usuario,
            Notificacion.leida.is_(False),
        )
    ).all()

    return {"total": len(notificaciones)}


@router.patch(
    "/{id_notificacion}/leer",
    response_model=NotificacionRespuesta,
)
def marcar_leida(
    id_notificacion: int,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    notificacion = db.scalar(
        select(Notificacion).where(
            Notificacion.id_notificacion == id_notificacion,
            Notificacion.id_usuario == usuario.id_usuario,
        )
    )

    if notificacion is None:
        raise HTTPException(
            status_code=404,
            detail="Notificacion no encontrada",
        )

    notificacion.leida = True

    db.commit()
    db.refresh(notificacion)

    return notificacion
