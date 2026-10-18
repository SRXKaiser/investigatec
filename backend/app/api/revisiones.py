
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.api.auth import obtener_usuario_actual
from app.core.permissions import (
    requerir_admin,
    requerir_revisor,
    tiene_rol,
)
from app.db.session import get_db

from app.models.usuario import Usuario
from app.models.proyecto import Proyecto
from app.models.archivo import Archivo
from app.models.revision import Revision
from app.models.decision import Decision
from app.models.historial import HistorialEstado
from app.models.notificacion import Notificacion

from app.schemas.revision import (
    RevisionAsignar,
    RevisionDecidir,
    RevisionRespuesta,
    DecisionRespuesta,
    HistorialRespuesta,
)


router = APIRouter(
    prefix="/revisiones",
    tags=["Revisiones"],
)


def cambiar_estado(
    db: Session,
    proyecto: Proyecto,
    estado_nuevo: str,
    id_usuario: int,
):
    anterior = proyecto.estado

    if anterior == estado_nuevo:
        return

    proyecto.estado = estado_nuevo

    db.add(
        HistorialEstado(
            id_proyecto=proyecto.id_proyecto,
            estado_anterior=anterior,
            estado_nuevo=estado_nuevo,
            id_usuario=id_usuario,
        )
    )


def notificar(
    db: Session,
    id_usuario: int,
    titulo: str,
    mensaje: str,
):
    db.add(
        Notificacion(
            id_usuario=id_usuario,
            titulo=titulo,
            mensaje=mensaje,
            leida=False,
        )
    )


@router.post(
    "/asignar",
    response_model=RevisionRespuesta,
    status_code=201,
)
def asignar_revision(
    datos: RevisionAsignar,
    admin: Usuario = Depends(requerir_admin),
    db: Session = Depends(get_db),
):
    try:
        archivo = db.get(Archivo, datos.id_archivo)

        if archivo is None:
            raise HTTPException(
                status_code=404,
                detail="Documento no encontrado",
            )

        proyecto = db.scalar(
            select(Proyecto)
            .where(Proyecto.id_proyecto == archivo.id_proyecto)
            .with_for_update()
        )

        if proyecto.estado not in ("BORRADOR", "CORRECCIONES"):
            raise HTTPException(
                status_code=409,
                detail="El proyecto no admite una nueva revision",
            )

        revisor = db.get(Usuario, datos.id_revisor)

        if revisor is None or not revisor.activo:
            raise HTTPException(
                status_code=404,
                detail="Revisor no encontrado o inactivo",
            )

        if not tiene_rol(db, revisor.id_usuario, "REVISOR"):
            raise HTTPException(
                status_code=403,
                detail="El usuario no tiene el rol REVISOR",
            )

        ultima_version = db.scalar(
            select(func.max(Archivo.version)).where(
                Archivo.id_proyecto == archivo.id_proyecto,
                Archivo.nombre_original == archivo.nombre_original,
            )
        )

        if archivo.version != ultima_version:
            raise HTTPException(
                status_code=409,
                detail="Solo se puede revisar la version mas reciente",
            )

        revision_anterior = db.scalar(
            select(Revision.id_revision)
            .where(Revision.id_archivo == archivo.id_archivo)
            .limit(1)
        )

        if revision_anterior is not None:
            raise HTTPException(
                status_code=409,
                detail="Este archivo ya fue enviado a revision",
            )

        # Una sola revision activa por proyecto.
        pendiente = db.scalar(
            select(Revision.id_revision)
            .join(Archivo, Revision.id_archivo == Archivo.id_archivo)
            .where(
                Archivo.id_proyecto == proyecto.id_proyecto,
                Revision.estado == "PENDIENTE",
            )
            .limit(1)
        )

        if pendiente is not None:
            raise HTTPException(
                status_code=409,
                detail="El proyecto ya tiene una revision pendiente",
            )

        revision = Revision(
            id_archivo=archivo.id_archivo,
            id_revisor=revisor.id_usuario,
            estado="PENDIENTE",
        )

        db.add(revision)

        cambiar_estado(
            db, proyecto, "PENDIENTE", admin.id_usuario
        )

        notificar(
            db,
            revisor.id_usuario,
            "Nueva revision asignada",
            f"Se te asigno el documento {archivo.nombre_original} "
            f"del proyecto {proyecto.titulo}.",
        )

        db.commit()
        db.refresh(revision)
        return revision

    except Exception:
        db.rollback()
        raise


@router.get(
    "/pendientes",
    response_model=list[RevisionRespuesta],
)
def mis_revisiones_pendientes(
    revisor: Usuario = Depends(requerir_revisor),
    db: Session = Depends(get_db),
):
    return db.scalars(
        select(Revision)
        .where(
            Revision.id_revisor == revisor.id_usuario,
            Revision.estado == "PENDIENTE",
        )
        .order_by(Revision.fecha_asignacion)
    ).all()


@router.get(
    "/mis-revisiones",
    response_model=list[RevisionRespuesta],
)
def mis_revisiones(
    revisor: Usuario = Depends(requerir_revisor),
    db: Session = Depends(get_db),
):
    return db.scalars(
        select(Revision)
        .where(Revision.id_revisor == revisor.id_usuario)
        .order_by(Revision.fecha_asignacion.desc())
    ).all()


@router.post(
    "/{id_revision}/decision",
    response_model=DecisionRespuesta,
    status_code=201,
)
def registrar_decision(
    id_revision: int,
    datos: RevisionDecidir,
    revisor: Usuario = Depends(requerir_revisor),
    db: Session = Depends(get_db),
):
    try:
        revision = db.scalar(
            select(Revision)
            .where(Revision.id_revision == id_revision)
            .with_for_update()
        )

        if revision is None:
            raise HTTPException(
                status_code=404,
                detail="Revision no encontrada",
            )

        if revision.id_revisor != revisor.id_usuario:
            raise HTTPException(
                status_code=403,
                detail="No eres el revisor asignado",
            )

        if revision.estado != "PENDIENTE":
            raise HTTPException(
                status_code=409,
                detail="La revision ya fue finalizada",
            )

        archivo = db.get(Archivo, revision.id_archivo)

        proyecto = db.scalar(
            select(Proyecto)
            .where(Proyecto.id_proyecto == archivo.id_proyecto)
            .with_for_update()
        )

        if proyecto.estado != "PENDIENTE":
            raise HTTPException(
                status_code=409,
                detail="El proyecto no esta pendiente de revision",
            )

        if (
            datos.resultado == "CORRECCIONES"
            and not (datos.comentario or "").strip()
        ):
            raise HTTPException(
                status_code=422,
                detail="Debes indicar las correcciones solicitadas",
            )

        decision_existente = db.scalar(
            select(Decision.id_decision)
            .where(Decision.id_revision == id_revision)
            .limit(1)
        )

        if decision_existente is not None:
            raise HTTPException(
                status_code=409,
                detail="Esta revision ya tiene una decision",
            )

        comentario = (
            datos.comentario.strip()
            if datos.comentario
            else None
        )

        decision = Decision(
            id_revision=revision.id_revision,
            resultado=datos.resultado,
            comentario=comentario,
        )

        revision.estado = datos.resultado
        revision.observaciones = comentario
        revision.fecha_revision = datetime.now(timezone.utc)

        db.add(decision)

        cambiar_estado(
            db,
            proyecto,
            datos.resultado,
            revisor.id_usuario,
        )

        notificar(
            db,
            proyecto.id_usuario,
            "Resultado de revision",
            f"El documento {archivo.nombre_original} "
            f"recibio el resultado {datos.resultado}. "
            f"Observaciones: {comentario or 'Sin observaciones'}.",
        )

        db.commit()
        db.refresh(decision)
        return decision

    except Exception:
        db.rollback()
        raise


@router.get(
    "/proyectos/{id_proyecto}/historial",
    response_model=list[HistorialRespuesta],
)
def consultar_historial(
    id_proyecto: int,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    proyecto = db.get(Proyecto, id_proyecto)

    if proyecto is None:
        raise HTTPException(
            status_code=404,
            detail="Proyecto no encontrado",
        )

    es_propietario = proyecto.id_usuario == usuario.id_usuario
    es_admin = tiene_rol(db, usuario.id_usuario, "ADMIN")

    es_revisor_asignado = db.scalar(
        select(Revision.id_revision)
        .join(Archivo, Revision.id_archivo == Archivo.id_archivo)
        .where(
            Archivo.id_proyecto == id_proyecto,
            Revision.id_revisor == usuario.id_usuario,
        )
        .limit(1)
    ) is not None

    if not (
        es_propietario
        or es_admin
        or es_revisor_asignado
    ):
        raise HTTPException(
            status_code=403,
            detail="No tienes acceso al historial",
        )

    return db.scalars(
        select(HistorialEstado)
        .where(HistorialEstado.id_proyecto == id_proyecto)
        .order_by(HistorialEstado.fecha_cambio)
    ).all()
