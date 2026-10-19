
from datetime import date, datetime, time, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.permissions import tiene_rol
from app.models.proyecto import Proyecto
from app.models.asignacion_revisor import AsignacionRevisor


ESTADOS_VALIDOS = {
    "BORRADOR",
    "PENDIENTE",
    "CORRECCIONES",
    "APROBADO",
}


def buscar_proyectos(
    db: Session,
    id_usuario: int,
    titulo: str | None = None,
    estado: str | None = None,
    id_investigador: int | None = None,
    id_revisor: int | None = None,
    fecha_desde: date | None = None,
    fecha_hasta: date | None = None,
    pagina: int = 1,
    limite: int = 10,
):
    es_admin = tiene_rol(
        db, id_usuario, "ADMIN"
    )

    es_revisor = tiene_rol(
        db, id_usuario, "REVISOR"
    )

    consulta = select(Proyecto)

    # Primero se aplican los permisos.
    # Los filtros posteriores nunca amplian el acceso.
    if not es_admin:
        if es_revisor:
            consulta = consulta.outerjoin(
                AsignacionRevisor,
                AsignacionRevisor.id_investigador
                == Proyecto.id_usuario,
            ).where(
                (
                    (Proyecto.id_usuario == id_usuario)
                    |
                    (
                        AsignacionRevisor.id_revisor
                        == id_usuario
                    )
                )
            )
        else:
            consulta = consulta.where(
                Proyecto.id_usuario == id_usuario
            )

    if titulo:
        titulo = titulo.strip()

        if titulo:
            consulta = consulta.where(
                Proyecto.titulo.ilike(
                    f"%{titulo}%"
                )
            )

    if estado:
        estado = estado.strip().upper()

        if estado not in ESTADOS_VALIDOS:
            raise HTTPException(
                status_code=422,
                detail=(
                    "Estado invalido. Valores permitidos: "
                    + ", ".join(sorted(ESTADOS_VALIDOS))
                ),
            )

        consulta = consulta.where(
            Proyecto.estado == estado
        )

    if id_investigador is not None:
        consulta = consulta.where(
            Proyecto.id_usuario == id_investigador
        )

    if id_revisor is not None:
        if not es_admin:
            raise HTTPException(
                status_code=403,
                detail=(
                    "Solo el administrador puede "
                    "filtrar por revisor"
                ),
            )

        consulta = consulta.join(
            AsignacionRevisor,
            AsignacionRevisor.id_investigador
            == Proyecto.id_usuario,
        ).where(
            AsignacionRevisor.id_revisor
            == id_revisor
        )

    if (
        fecha_desde is not None
        and fecha_hasta is not None
        and fecha_desde > fecha_hasta
    ):
        raise HTTPException(
            status_code=422,
            detail=(
                "fecha_desde no puede ser "
                "posterior a fecha_hasta"
            ),
        )

    if fecha_desde is not None:
        inicio = datetime.combine(
            fecha_desde,
            time.min,
            tzinfo=timezone.utc,
        )

        consulta = consulta.where(
            Proyecto.fecha_creacion >= inicio
        )

    
    if fecha_hasta is not None:
        if fecha_hasta == date.max:
            consulta = consulta.where(
                Proyecto.fecha_creacion
                <= datetime.max.replace(
                    tzinfo=timezone.utc
                )
            )
        else:
            fin_exclusivo = datetime.combine(
                fecha_hasta + timedelta(days=1),
                time.min,
                tzinfo=timezone.utc,
            )

            consulta = consulta.where(
                Proyecto.fecha_creacion < fin_exclusivo
            )

    total = db.scalar(
        select(func.count()).select_from(
            consulta.order_by(None).subquery()
        )
    ) or 0

    consulta = consulta.order_by(
        Proyecto.fecha_actualizacion.desc(),
        Proyecto.id_proyecto.desc(),
    )

    consulta = consulta.offset(
        (pagina - 1) * limite
    ).limit(limite)

    proyectos = db.scalars(
        consulta
    ).all()

    return {
        "total": total,
        "pagina": pagina,
        "limite": limite,
        "total_paginas": (
            (total + limite - 1) // limite
        ),
        "resultados": proyectos,
    }
