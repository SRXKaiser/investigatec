
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.proyecto import Proyecto
from app.models.archivo import Archivo
from app.schemas.proyecto import ProyectoCrear, ProyectoActualizar


def crear_proyecto(db: Session, id_usuario: int, datos: ProyectoCrear):
    proyecto = Proyecto(
        id_usuario=id_usuario,
        titulo=datos.titulo,
        descripcion=datos.descripcion,
        estado="BORRADOR",
    )

    db.add(proyecto)
    db.commit()
    db.refresh(proyecto)
    return proyecto


def listar_proyectos(db: Session, id_usuario: int):
    return db.scalars(
        select(Proyecto)
        .where(Proyecto.id_usuario == id_usuario)
        .order_by(Proyecto.fecha_creacion.desc())
    ).all()


def obtener_proyecto(db: Session, id_proyecto: int, id_usuario: int):
    proyecto = db.scalar(
        select(Proyecto).where(
            Proyecto.id_proyecto == id_proyecto,
            Proyecto.id_usuario == id_usuario,
        )
    )

    if proyecto is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proyecto no encontrado",
        )

    return proyecto


def actualizar_proyecto(
    db: Session,
    id_proyecto: int,
    id_usuario: int,
    datos: ProyectoActualizar,
):
    proyecto = obtener_proyecto(db, id_proyecto, id_usuario)

    if proyecto.estado != "BORRADOR":
        raise HTTPException(
            status_code=409,
            detail="Solo se pueden editar proyectos en borrador",
        )

    cambios = datos.model_dump(exclude_unset=True)

    if "titulo" in cambios and cambios["titulo"] is None:
        raise HTTPException(
            status_code=422,
            detail="El titulo no puede ser nulo",
        )

    for campo, valor in cambios.items():
        setattr(proyecto, campo, valor)

    db.commit()
    db.refresh(proyecto)
    return proyecto


def eliminar_proyecto(db: Session, id_proyecto: int, id_usuario: int):
    proyecto = obtener_proyecto(db, id_proyecto, id_usuario)

    if proyecto.estado != "BORRADOR":
        raise HTTPException(
            status_code=409,
            detail="Solo se pueden eliminar proyectos en borrador",
        )

    tiene_archivos = db.scalar(
        select(Archivo.id_archivo)
        .where(Archivo.id_proyecto == id_proyecto)
        .limit(1)
    )

    if tiene_archivos is not None:
        raise HTTPException(
            status_code=409,
            detail="No se puede eliminar un proyecto con documentos",
        )

    db.delete(proyecto)
    db.commit()
