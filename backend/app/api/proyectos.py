
from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.auth import obtener_usuario_actual
from app.models.usuario import Usuario
from app.schemas.proyecto import (
    ProyectoCrear,
    ProyectoActualizar,
    ProyectoRespuesta,
)
from app.services import proyectos as servicio


router = APIRouter(prefix="/proyectos", tags=["Proyectos"])


@router.post(
    "/",
    response_model=ProyectoRespuesta,
    status_code=status.HTTP_201_CREATED,
)
def crear(
    datos: ProyectoCrear,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obtener_usuario_actual),
):
    return servicio.crear_proyecto(db, usuario.id_usuario, datos)


@router.get("/", response_model=list[ProyectoRespuesta])
def listar(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obtener_usuario_actual),
):
    return servicio.listar_proyectos(db, usuario.id_usuario)


@router.get("/{id_proyecto}", response_model=ProyectoRespuesta)
def obtener(
    id_proyecto: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obtener_usuario_actual),
):
    return servicio.obtener_proyecto(
        db, id_proyecto, usuario.id_usuario
    )


@router.patch("/{id_proyecto}", response_model=ProyectoRespuesta)
def actualizar(
    id_proyecto: int,
    datos: ProyectoActualizar,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obtener_usuario_actual),
):
    return servicio.actualizar_proyecto(
        db, id_proyecto, usuario.id_usuario, datos
    )


@router.delete(
    "/{id_proyecto}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def eliminar(
    id_proyecto: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obtener_usuario_actual),
):
    servicio.eliminar_proyecto(
        db, id_proyecto, usuario.id_usuario
    )
    return Response(status_code=204)
