from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.auth import obtener_usuario_actual
from app.db.session import get_db
from app.models.usuario import Usuario
from app.models.perfil import (
    Perfil,
    EnlacePerfil,
    AreaInvestigacion,
    PerfilArea,
)
from app.schemas.academico import (
    EnlaceCrear,
    EnlaceRespuesta,
    AreaRespuesta,
    AreasActualizar,
)

router = APIRouter(
    prefix="/academico",
    tags=["Información académica"],
)


def buscar_mi_perfil(db: Session, usuario: Usuario) -> Perfil:
    perfil = db.scalar(
        select(Perfil).where(
            Perfil.id_usuario == usuario.id_usuario
        )
    )

    if perfil is None:
        raise HTTPException(
            status_code=404,
            detail="El usuario no tiene un perfil académico",
        )

    return perfil


@router.post(
    "/enlaces",
    response_model=EnlaceRespuesta,
    status_code=status.HTTP_201_CREATED,
)
def agregar_enlace(
    datos: EnlaceCrear,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    perfil = buscar_mi_perfil(db, usuario)

    enlace = EnlacePerfil(
        id_perfil=perfil.id_perfil,
        tipo=datos.tipo.strip(),
        url=str(datos.url),
        orden=datos.orden,
    )

    db.add(enlace)
    db.commit()
    db.refresh(enlace)

    return enlace


@router.get("/enlaces", response_model=list[EnlaceRespuesta])
def listar_mis_enlaces(
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    perfil = buscar_mi_perfil(db, usuario)

    return db.scalars(
        select(EnlacePerfil)
        .where(EnlacePerfil.id_perfil == perfil.id_perfil)
        .order_by(EnlacePerfil.orden, EnlacePerfil.id_enlace)
    ).all()


@router.delete("/enlaces/{id_enlace}", status_code=204)
def eliminar_enlace(
    id_enlace: int,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    perfil = buscar_mi_perfil(db, usuario)

    enlace = db.scalar(
        select(EnlacePerfil).where(
            EnlacePerfil.id_enlace == id_enlace,
            EnlacePerfil.id_perfil == perfil.id_perfil,
        )
    )

    if enlace is None:
        raise HTTPException(
            status_code=404,
            detail="Enlace no encontrado",
        )

    db.delete(enlace)
    db.commit()


@router.get("/areas", response_model=list[AreaRespuesta])
def listar_areas(db: Session = Depends(get_db)):
    return db.scalars(
        select(AreaInvestigacion)
        .order_by(AreaInvestigacion.nombre)
    ).all()


@router.put("/mis-areas", response_model=list[AreaRespuesta])
def actualizar_mis_areas(
    datos: AreasActualizar,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    perfil = buscar_mi_perfil(db, usuario)
    ids = set(datos.ids_areas)

    areas = db.scalars(
        select(AreaInvestigacion).where(
            AreaInvestigacion.id_area.in_(ids)
        )
    ).all() if ids else []

    if len(areas) != len(ids):
        raise HTTPException(
            status_code=400,
            detail="Una o más áreas de investigación no existen",
        )

    anteriores = db.scalars(
        select(PerfilArea).where(
            PerfilArea.id_perfil == perfil.id_perfil
        )
    ).all()

    for relacion in anteriores:
        db.delete(relacion)

    db.flush()

    for area in areas:
        db.add(
            PerfilArea(
                id_perfil=perfil.id_perfil,
                id_area=area.id_area,
            )
        )

    db.commit()

    return areas


@router.get("/mis-areas", response_model=list[AreaRespuesta])
def obtener_mis_areas(
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    perfil = buscar_mi_perfil(db, usuario)

    return db.scalars(
        select(AreaInvestigacion)
        .join(
            PerfilArea,
            PerfilArea.id_area == AreaInvestigacion.id_area,
        )
        .where(PerfilArea.id_perfil == perfil.id_perfil)
        .order_by(AreaInvestigacion.nombre)
    ).all()