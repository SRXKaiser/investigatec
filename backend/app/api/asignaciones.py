
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.auth import obtener_usuario_actual
from app.core.permissions import requerir_admin, tiene_rol
from app.db.session import get_db
from app.models.usuario import Usuario
from app.models.asignacion_revisor import AsignacionRevisor
from app.schemas.asignacion_revisor import (
    AsignacionRevisorCrear,
    AsignacionRevisorRespuesta,
)


router = APIRouter(
    prefix="/asignaciones",
    tags=["Asignacion de revisores"],
)


@router.put(
    "/investigadores/{id_investigador}/revisor",
    response_model=AsignacionRevisorRespuesta,
)
def asignar_revisor(
    id_investigador: int,
    datos: AsignacionRevisorCrear,
    admin: Usuario = Depends(requerir_admin),
    db: Session = Depends(get_db),
):
    investigador = db.get(Usuario, id_investigador)
    revisor = db.get(Usuario, datos.id_revisor)

    if investigador is None or not investigador.activo:
        raise HTTPException(
            status_code=404,
            detail="Investigador no encontrado o inactivo",
        )

    if revisor is None or not revisor.activo:
        raise HTTPException(
            status_code=404,
            detail="Revisor no encontrado o inactivo",
        )

    if id_investigador == datos.id_revisor:
        raise HTTPException(
            status_code=400,
            detail="Un investigador no puede revisarse a si mismo",
        )

    if not tiene_rol(db, datos.id_revisor, "REVISOR"):
        raise HTTPException(
            status_code=403,
            detail="El usuario seleccionado no tiene el rol REVISOR",
        )

    asignacion = db.get(
        AsignacionRevisor,
        id_investigador,
    )

    if asignacion is None:
        asignacion = AsignacionRevisor(
            id_investigador=id_investigador,
            id_revisor=datos.id_revisor,
            asignado_por=admin.id_usuario,
        )
        db.add(asignacion)
    else:
        if asignacion.id_revisor != datos.id_revisor:
            asignacion.id_revisor = datos.id_revisor
            asignacion.asignado_por = admin.id_usuario

    db.commit()
    db.refresh(asignacion)

    return asignacion


@router.get(
    "/investigadores/{id_investigador}/revisor",
    response_model=AsignacionRevisorRespuesta,
)
def consultar_revisor(
    id_investigador: int,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    if (
        usuario.id_usuario != id_investigador
        and not tiene_rol(db, usuario.id_usuario, "ADMIN")
    ):
        raise HTTPException(
            status_code=403,
            detail="No tienes permisos para consultar esta asignacion",
        )

    asignacion = db.get(
        AsignacionRevisor,
        id_investigador,
    )

    if asignacion is None:
        raise HTTPException(
            status_code=404,
            detail="El investigador no tiene un revisor asignado",
        )

    return asignacion


@router.get(
    "/mis-investigadores",
)
def consultar_mis_investigadores(
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    if not tiene_rol(db, usuario.id_usuario, "REVISOR"):
        raise HTTPException(
            status_code=403,
            detail="Se requiere el rol REVISOR",
        )

    asignaciones = db.scalars(
        select(AsignacionRevisor)
        .where(
            AsignacionRevisor.id_revisor == usuario.id_usuario
        )
        .order_by(AsignacionRevisor.id_investigador)
    ).all()

    resultado = []

    for asignacion in asignaciones:
        investigador = db.get(
            Usuario,
            asignacion.id_investigador,
        )

        if investigador is None:
            continue

        resultado.append({
            "id_investigador": investigador.id_usuario,
            "nombre": investigador.nombre,
            "apellido_paterno": investigador.apellido_paterno,
            "correo": investigador.correo,
            "activo": investigador.activo,
        })

    return resultado


@router.get(
    "/",
    response_model=list[AsignacionRevisorRespuesta],
)
def listar_asignaciones(
    admin: Usuario = Depends(requerir_admin),
    db: Session = Depends(get_db),
):
    return db.scalars(
        select(AsignacionRevisor)
        .order_by(AsignacionRevisor.id_investigador)
    ).all()
