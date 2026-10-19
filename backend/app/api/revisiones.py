
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
from app.services.estados import actualizar_estado_proyecto
from app.models.notificacion import Notificacion
from app.models.asignacion_revisor import AsignacionRevisor

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


def notificar(db, id_usuario, titulo, mensaje):
    db.add(
        Notificacion(
            id_usuario=id_usuario,
            titulo=titulo,
            mensaje=mensaje,
            leida=False,
        )
    )


def validar_documento_para_revision(db, archivo):
    """
    Permite revisar solamente la ultima version
    de un documento que no haya sido enviada antes.
    """

    ultima = db.scalar(
        select(Archivo)
        .where(
            Archivo.id_proyecto == archivo.id_proyecto,
            Archivo.nombre_original == archivo.nombre_original,
        )
        .order_by(
            Archivo.version.desc(),
            Archivo.id_archivo.desc(),
        )
        .limit(1)
    )

    if ultima is None or ultima.id_archivo != archivo.id_archivo:
        raise HTTPException(
            status_code=409,
            detail="Debes enviar la version mas reciente",
        )

    revision_previa = db.scalar(
        select(Revision.id_revision)
        .where(Revision.id_archivo == archivo.id_archivo)
        .limit(1)
    )

    if revision_previa is not None:
        raise HTTPException(
            status_code=409,
            detail="Esta version ya fue enviada a revision",
        )

    # No se permite crear otra version pendiente
    # del mismo documento.
    pendiente = db.scalar(
        select(Revision.id_revision)
        .join(Archivo, Revision.id_archivo == Archivo.id_archivo)
        .where(
            Archivo.id_proyecto == archivo.id_proyecto,
            Archivo.nombre_original == archivo.nombre_original,
            Revision.estado == "PENDIENTE",
        )
        .limit(1)
    )

    if pendiente is not None:
        raise HTTPException(
            status_code=409,
            detail="Este documento ya tiene una revision pendiente",
        )


def crear_revision(db, archivo, proyecto, id_revisor, id_usuario):
    revision = Revision(
        id_archivo=archivo.id_archivo,
        id_revisor=id_revisor,
        estado="PENDIENTE",
    )

    db.add(revision)
    db.flush()

    actualizar_estado_proyecto(
        db,
        proyecto,
        id_usuario,
    )

    notificar(
        db,
        id_revisor,
        "Documento pendiente de revision",
        (
            f"El documento {archivo.nombre_original} "
            f"(version {archivo.version}) del proyecto "
            f"{proyecto.titulo} requiere tu revision."
        ),
    )

    db.commit()
    db.refresh(revision)

    return revision


@router.post(
    "/enviar/{id_archivo}",
    response_model=RevisionRespuesta,
    status_code=201,
)
def enviar_a_revision(
    id_archivo: int,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    try:
        archivo = db.get(Archivo, id_archivo)

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

        if proyecto is None:
            raise HTTPException(
                status_code=404,
                detail="Proyecto no encontrado",
            )

        if proyecto.id_usuario != usuario.id_usuario:
            raise HTTPException(
                status_code=403,
                detail="Solo el investigador propietario puede enviar",
            )

        validar_documento_para_revision(db, archivo)

        asignacion = db.get(
            AsignacionRevisor,
            usuario.id_usuario,
        )

        if asignacion is None:
            raise HTTPException(
                status_code=409,
                detail="No tienes un revisor asignado",
            )

        revisor = db.get(Usuario, asignacion.id_revisor)

        if (
            revisor is None
            or not revisor.activo
            or not tiene_rol(db, revisor.id_usuario, "REVISOR")
        ):
            raise HTTPException(
                status_code=409,
                detail="El revisor asignado no esta disponible",
            )

        return crear_revision(
            db,
            archivo,
            proyecto,
            revisor.id_usuario,
            usuario.id_usuario,
        )

    except Exception:
        db.rollback()
        raise


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
    """
    Asignacion manual administrativa.
    Se conserva por compatibilidad.
    """

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

        if proyecto is None:
            raise HTTPException(
                status_code=404,
                detail="Proyecto no encontrado",
            )

        revisor = db.get(Usuario, datos.id_revisor)

        if (
            revisor is None
            or not revisor.activo
            or not tiene_rol(db, revisor.id_usuario, "REVISOR")
        ):
            raise HTTPException(
                status_code=422,
                detail="El usuario seleccionado no es un revisor activo",
            )

        validar_documento_para_revision(db, archivo)

        return crear_revision(
            db,
            archivo,
            proyecto,
            revisor.id_usuario,
            admin.id_usuario,
        )

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
        .order_by(
            Revision.fecha_asignacion,
            Revision.id_revision,
        )
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
        .order_by(
            Revision.fecha_asignacion.desc(),
            Revision.id_revision.desc(),
        )
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
        # Bloqueamos primero el proyecto para mantener
        # un orden consistente de bloqueos.
        id_proyecto = db.scalar(
            select(Archivo.id_proyecto)
            .join(Revision, Revision.id_archivo == Archivo.id_archivo)
            .where(Revision.id_revision == id_revision)
        )

        if id_proyecto is None:
            raise HTTPException(
                status_code=404,
                detail="Revision no encontrada",
            )

        proyecto = db.scalar(
            select(Proyecto)
            .where(Proyecto.id_proyecto == id_proyecto)
            .with_for_update()
        )

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
                detail="La revision ya tiene una decision",
            )

        archivo = db.get(Archivo, revision.id_archivo)

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

        db.add(decision)

        revision.estado = datos.resultado
        revision.observaciones = comentario
        revision.fecha_revision = datetime.now(timezone.utc)

        db.flush()

        actualizar_estado_proyecto(
            db,
            proyecto,
            revisor.id_usuario,
        )

        notificar(
            db,
            proyecto.id_usuario,
            "Resultado de revision",
            (
                f"El documento {archivo.nombre_original} "
                f"recibio el resultado {datos.resultado}. "
                f"Observaciones: {comentario or 'Sin observaciones'}."
            ),
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

    es_propietario = (
        proyecto.id_usuario == usuario.id_usuario
    )

    es_admin = tiene_rol(
        db,
        usuario.id_usuario,
        "ADMIN",
    )

    es_revisor = db.scalar(
        select(Revision.id_revision)
        .join(Archivo, Revision.id_archivo == Archivo.id_archivo)
        .where(
            Archivo.id_proyecto == id_proyecto,
            Revision.id_revisor == usuario.id_usuario,
        )
        .limit(1)
    ) is not None

    if not (es_propietario or es_admin or es_revisor):
        raise HTTPException(
            status_code=403,
            detail="No tienes acceso al historial",
        )

    return db.scalars(
        select(HistorialEstado)
        .where(HistorialEstado.id_proyecto == id_proyecto)
        .order_by(
            HistorialEstado.fecha_cambio,
            HistorialEstado.id_historial,
        )
    ).all()
