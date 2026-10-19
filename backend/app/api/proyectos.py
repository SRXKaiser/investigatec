
from datetime import date

from fastapi import (
    APIRouter,
    Depends,
    Query,
    Response,
    status,
)
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.auth import obtener_usuario_actual
from app.models.usuario import Usuario

from app.schemas.proyecto import (
    ProyectoCrear,
    ProyectoActualizar,
    ProyectoRespuesta,
)
from app.schemas.busqueda_proyectos import (
    BusquedaProyectosRespuesta,
)

from app.services import proyectos as servicio
from app.services.busqueda_proyectos import (
    buscar_proyectos,
)


router = APIRouter(
    prefix="/proyectos",
    tags=["Proyectos"],
)


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
    return servicio.crear_proyecto(
        db,
        usuario.id_usuario,
        datos,
    )


@router.get(
    "/",
    response_model=list[ProyectoRespuesta],
)
def listar(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obtener_usuario_actual),
):
    return servicio.listar_proyectos(
        db,
        usuario.id_usuario,
    )


# Esta ruta debe declararse ANTES de
# /{id_proyecto}, para evitar conflictos.
@router.get(
    "/buscar",
    response_model=BusquedaProyectosRespuesta,
)
def buscar(
    titulo: str | None = Query(
        default=None,
        max_length=255,
        description="Busqueda parcial por titulo",
    ),
    estado: str | None = Query(
        default=None,
        description="Estado del proyecto",
    ),
    id_investigador: int | None = Query(
        default=None,
        ge=1,
    ),
    id_revisor: int | None = Query(
        default=None,
        ge=1,
    ),
    fecha_desde: date | None = Query(
        default=None,
        description="Fecha inicial de creacion",
    ),
    fecha_hasta: date | None = Query(
        default=None,
        description="Fecha final de creacion",
    ),
    pagina: int = Query(
        default=1,
        ge=1,
    ),
    limite: int = Query(
        default=10,
        ge=1,
        le=100,
    ),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obtener_usuario_actual),
):
    return buscar_proyectos(
        db=db,
        id_usuario=usuario.id_usuario,
        titulo=titulo,
        estado=estado,
        id_investigador=id_investigador,
        id_revisor=id_revisor,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        pagina=pagina,
        limite=limite,
    )


@router.get(
    "/{id_proyecto}",
    response_model=ProyectoRespuesta,
)
def obtener(
    id_proyecto: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obtener_usuario_actual),
):
    return servicio.obtener_proyecto(
        db,
        id_proyecto,
        usuario.id_usuario,
    )


@router.patch(
    "/{id_proyecto}",
    response_model=ProyectoRespuesta,
)
def actualizar(
    id_proyecto: int,
    datos: ProyectoActualizar,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obtener_usuario_actual),
):
    return servicio.actualizar_proyecto(
        db,
        id_proyecto,
        usuario.id_usuario,
        datos,
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
        db,
        id_proyecto,
        usuario.id_usuario,
    )

    return Response(
        status_code=204
    )
