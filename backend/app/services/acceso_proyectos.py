
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.permissions import tiene_rol
from app.models.proyecto import Proyecto
from app.models.archivo import Archivo
from app.models.revision import Revision
from app.models.asignacion_revisor import (
    AsignacionRevisor,
)


def filtro_proyectos_visibles(
    db: Session,
    id_usuario: int,
):
    if tiene_rol(db, id_usuario, "ADMIN"):
        return True

    investigadores_asignados = (
        select(AsignacionRevisor.id_investigador)
        .where(
            AsignacionRevisor.id_revisor
            == id_usuario
        )
    )

    proyectos_revisados = (
        select(Archivo.id_proyecto)
        .join(
            Revision,
            Revision.id_archivo
            == Archivo.id_archivo,
        )
        .where(
            Revision.id_revisor == id_usuario
        )
    )

    return or_(
        Proyecto.id_usuario == id_usuario,
        Proyecto.id_usuario.in_(
            investigadores_asignados
        ),
        Proyecto.id_proyecto.in_(
            proyectos_revisados
        ),
    )


def puede_consultar_proyecto(
    db: Session,
    id_proyecto: int,
    id_usuario: int,
) -> bool:
    existe = db.scalar(
        select(Proyecto.id_proyecto)
        .where(
            Proyecto.id_proyecto == id_proyecto,
            filtro_proyectos_visibles(
                db,
                id_usuario,
            ),
        )
        .limit(1)
    )

    return existe is not None
