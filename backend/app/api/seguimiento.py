
from collections import Counter

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.auth import obtener_usuario_actual
from app.core.permissions import tiene_rol
from app.db.session import get_db

from app.models.usuario import Usuario
from app.models.proyecto import Proyecto
from app.models.archivo import Archivo
from app.models.revision import Revision
from app.models.decision import Decision
from app.models.asignacion_revisor import AsignacionRevisor


router = APIRouter(
    prefix="/seguimiento",
    tags=["Seguimiento de documentos"],
)


def validar_acceso_proyecto(
    db: Session,
    proyecto: Proyecto,
    usuario: Usuario,
):
    if proyecto.id_usuario == usuario.id_usuario:
        return

    if tiene_rol(db, usuario.id_usuario, "ADMIN"):
        return

    if tiene_rol(db, usuario.id_usuario, "REVISOR"):
        asignacion = db.get(
            AsignacionRevisor,
            proyecto.id_usuario,
        )

        if (
            asignacion is not None
            and asignacion.id_revisor == usuario.id_usuario
        ):
            return

        revision_asignada = db.scalar(
            select(Revision.id_revision)
            .join(
                Archivo,
                Revision.id_archivo == Archivo.id_archivo,
            )
            .where(
                Archivo.id_proyecto == proyecto.id_proyecto,
                Revision.id_revisor == usuario.id_usuario,
            )
            .limit(1)
        )

        if revision_asignada is not None:
            return

    raise HTTPException(
        status_code=403,
        detail="No tienes permiso para consultar este proyecto",
    )


def obtener_estado_documento(revisiones):
    if not revisiones:
        return "BORRADOR"

    return revisiones[-1].estado


def obtener_resumen_estados(documentos):
    contador = Counter(
        documento["estado"]
        for documento in documentos
    )

    total = len(documentos)
    aprobados = contador["APROBADO"]
    pendientes = contador["PENDIENTE"]
    correcciones = contador["CORRECCIONES"]
    borradores = contador["BORRADOR"]

    porcentaje = (
        round(aprobados * 100 / total, 2)
        if total > 0
        else 0.0
    )

    return {
        "total_documentos": total,
        "aprobados": aprobados,
        "pendientes": pendientes,
        "correcciones": correcciones,
        "borradores": borradores,
        "porcentaje_aprobacion": porcentaje,
        "todos_aprobados": (
            total > 0 and aprobados == total
        ),
    }


def construir_seguimiento(
    db: Session,
    proyecto: Proyecto,
):
    archivos = db.scalars(
        select(Archivo)
        .where(
            Archivo.id_proyecto == proyecto.id_proyecto
        )
        .order_by(
            Archivo.nombre_original,
            Archivo.version,
            Archivo.id_archivo,
        )
    ).all()

    documentos = {}

    for archivo in archivos:
        nombre = archivo.nombre_original

        if nombre not in documentos:
            documentos[nombre] = {
                "nombre_documento": nombre,
                "estado": "BORRADOR",
                "version_actual": 0,
                "id_archivo_actual": None,
                "versiones": [],
            }

        revisiones = db.scalars(
            select(Revision)
            .where(
                Revision.id_archivo == archivo.id_archivo
            )
            .order_by(
                Revision.fecha_asignacion,
                Revision.id_revision,
            )
        ).all()

        historial_revisiones = []

        for revision in revisiones:
            decision = db.scalar(
                select(Decision)
                .where(
                    Decision.id_revision == revision.id_revision
                )
                .order_by(
                    Decision.id_decision.desc()
                )
                .limit(1)
            )

            historial_revisiones.append({
                "id_revision": revision.id_revision,
                "id_revisor": revision.id_revisor,
                "estado": revision.estado,
                "observaciones": revision.observaciones,
                "fecha_asignacion": revision.fecha_asignacion,
                "fecha_revision": revision.fecha_revision,
                "decision": (
                    {
                        "id_decision": decision.id_decision,
                        "resultado": decision.resultado,
                        "comentario": decision.comentario,
                        "fecha_decision": decision.fecha_decision,
                    }
                    if decision is not None
                    else None
                ),
            })

        version = {
            "id_archivo": archivo.id_archivo,
            "version": archivo.version,
            "nombre_original": archivo.nombre_original,
            "fecha_subida": archivo.fecha_subida,
            "resumen_detectado": archivo.resumen_detectado,
            "estado": obtener_estado_documento(revisiones),
            "revisiones": historial_revisiones,
        }

        documento = documentos[nombre]
        documento["versiones"].append(version)

        if (
            archivo.version > documento["version_actual"]
            or (
                archivo.version == documento["version_actual"]
                and (
                    documento["id_archivo_actual"] is None
                    or archivo.id_archivo
                    > documento["id_archivo_actual"]
                )
            )
        ):
            documento["version_actual"] = archivo.version
            documento["id_archivo_actual"] = archivo.id_archivo
            documento["estado"] = version["estado"]

    lista_documentos = list(documentos.values())

    resumen = obtener_resumen_estados(
        lista_documentos
    )

    return {
        "id_proyecto": proyecto.id_proyecto,
        "titulo": proyecto.titulo,
        "estado_proyecto": proyecto.estado,
        "id_investigador": proyecto.id_usuario,
        "total_documentos": resumen["total_documentos"],
        "resumen": resumen,
        "documentos": lista_documentos,
    }


@router.get("/mis-proyectos")
def seguimiento_mis_proyectos(
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    proyectos = db.scalars(
        select(Proyecto)
        .where(
            Proyecto.id_usuario == usuario.id_usuario
        )
        .order_by(
            Proyecto.id_proyecto.desc()
        )
    ).all()

    return [
        construir_seguimiento(db, proyecto)
        for proyecto in proyectos
    ]


@router.get("/proyectos/{id_proyecto}")
def seguimiento_proyecto(
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

    validar_acceso_proyecto(
        db,
        proyecto,
        usuario,
    )

    return construir_seguimiento(
        db,
        proyecto,
    )


@router.get("/revisor/mis-investigadores")
def seguimiento_investigadores(
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    if not tiene_rol(
        db,
        usuario.id_usuario,
        "REVISOR",
    ):
        raise HTTPException(
            status_code=403,
            detail="Se requiere el rol REVISOR",
        )

    asignaciones = db.scalars(
        select(AsignacionRevisor)
        .where(
            AsignacionRevisor.id_revisor == usuario.id_usuario
        )
    ).all()

    resultado = []

    for asignacion in asignaciones:
        investigador = db.get(
            Usuario,
            asignacion.id_investigador,
        )

        if investigador is None:
            continue

        proyectos = db.scalars(
            select(Proyecto)
            .where(
                Proyecto.id_usuario == investigador.id_usuario
            )
            .order_by(
                Proyecto.id_proyecto.desc()
            )
        ).all()

        resultado.append({
            "id_investigador": investigador.id_usuario,
            "nombre": investigador.nombre,
            "apellido_paterno": investigador.apellido_paterno,
            "correo": investigador.correo,
            "proyectos": [
                construir_seguimiento(db, proyecto)
                for proyecto in proyectos
            ],
        })

    return resultado


@router.get("/resumen/general")
def resumen_general(
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    """
    Resumen general de los proyectos del investigador.
    Los administradores obtienen un resumen global.
    """
    consulta = select(Proyecto)

    if not tiene_rol(
        db,
        usuario.id_usuario,
        "ADMIN",
    ):
        consulta = consulta.where(
            Proyecto.id_usuario == usuario.id_usuario
        )

    proyectos = db.scalars(consulta).all()

    totales = Counter()
    total_documentos = 0

    for proyecto in proyectos:
        seguimiento = construir_seguimiento(
            db,
            proyecto,
        )

        resumen = seguimiento["resumen"]

        total_documentos += resumen["total_documentos"]

        for estado in (
            "aprobados",
            "pendientes",
            "correcciones",
            "borradores",
        ):
            totales[estado] += resumen[estado]

    porcentaje = (
        round(
            totales["aprobados"]
            * 100
            / total_documentos,
            2,
        )
        if total_documentos > 0
        else 0.0
    )

    return {
        "total_proyectos": len(proyectos),
        "total_documentos": total_documentos,
        "aprobados": totales["aprobados"],
        "pendientes": totales["pendientes"],
        "correcciones": totales["correcciones"],
        "borradores": totales["borradores"],
        "porcentaje_aprobacion": porcentaje,
    }
