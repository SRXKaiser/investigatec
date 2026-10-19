
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.archivo import Archivo
from app.models.proyecto import Proyecto
from app.models.revision import Revision
from app.models.historial import HistorialEstado


def obtener_estado_documento(
    db: Session,
    id_archivo: int,
) -> str:
    revision = db.scalar(
        select(Revision)
        .where(Revision.id_archivo == id_archivo)
        .order_by(
            Revision.fecha_asignacion.desc(),
            Revision.id_revision.desc(),
        )
        .limit(1)
    )

    if revision is None:
        return "BORRADOR"

    return revision.estado


def calcular_estado_proyecto(
    db: Session,
    id_proyecto: int,
) -> str:
    archivos = db.scalars(
        select(Archivo)
        .where(Archivo.id_proyecto == id_proyecto)
        .order_by(
            Archivo.id_documento,
            Archivo.version.desc(),
            Archivo.id_archivo.desc(),
        )
    ).all()

    versiones_actuales = {}

    for archivo in archivos:
        if archivo.id_documento not in versiones_actuales:
            versiones_actuales[archivo.id_documento] = archivo

    if not versiones_actuales:
        return "BORRADOR"

    estados = [
        obtener_estado_documento(
            db,
            archivo.id_archivo,
        )
        for archivo in versiones_actuales.values()
    ]

    if "PENDIENTE" in estados:
        return "PENDIENTE"

    if "CORRECCIONES" in estados:
        return "CORRECCIONES"

    if "BORRADOR" in estados:
        return "BORRADOR"

    if all(estado == "APROBADO" for estado in estados):
        return "APROBADO"

    return "BORRADOR"


def actualizar_estado_proyecto(
    db: Session,
    proyecto: Proyecto,
    id_usuario: int,
) -> str:
    nuevo_estado = calcular_estado_proyecto(
        db,
        proyecto.id_proyecto,
    )

    estado_anterior = proyecto.estado

    if estado_anterior != nuevo_estado:
        proyecto.estado = nuevo_estado

        db.add(
            HistorialEstado(
                id_proyecto=proyecto.id_proyecto,
                estado_anterior=estado_anterior,
                estado_nuevo=nuevo_estado,
                id_usuario=id_usuario,
            )
        )

    return nuevo_estado
