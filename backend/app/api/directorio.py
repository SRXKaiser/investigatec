"""Directorio de perfiles academicos visibles para usuarios autenticados."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.api.auth import obtener_usuario_actual
from app.db.session import get_db
from app.models.perfil import Perfil
from app.models.usuario import Usuario
from app.schemas.directorio import DirectorioRespuesta, PerfilDirectorioRespuesta

router = APIRouter(prefix="/perfiles", tags=["Perfiles academicos"])


def escapar_like(texto: str) -> str:
    """Trata %, _ y \\ como texto literal durante la busqueda."""
    return texto.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


@router.get("/publicos", response_model=DirectorioRespuesta)
def listar_perfiles_publicos(
    buscar: str | None = Query(default=None, max_length=100),
    limite: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    """Lista solo perfiles visibles cuyos propietarios estan activos."""
    condiciones = [
        Perfil.perfil_visible.is_(True),
        Usuario.activo.is_(True),
    ]

    texto = (buscar or "").strip()
    if texto:
        patron = f"%{escapar_like(texto)}%"
        condiciones.append(
            or_(
                Perfil.username.ilike(patron, escape="\\"),
                Perfil.nombre_publico.ilike(patron, escape="\\"),
                Perfil.institucion.ilike(patron, escape="\\"),
                Perfil.especialidad.ilike(patron, escape="\\"),
            )
        )

    total = db.scalar(
        select(func.count(Perfil.id_perfil))
        .join(Usuario, Usuario.id_usuario == Perfil.id_usuario)
        .where(*condiciones)
    ) or 0

    perfiles = db.scalars(
        select(Perfil)
        .join(Usuario, Usuario.id_usuario == Perfil.id_usuario)
        .where(*condiciones)
        .order_by(
            func.lower(func.coalesce(Perfil.nombre_publico, Perfil.username)),
            Perfil.id_usuario,
        )
        .offset(offset)
        .limit(limite)
    ).all()

    return DirectorioRespuesta(
        total=total,
        limite=limite,
        offset=offset,
        resultados=[
            PerfilDirectorioRespuesta.model_validate(perfil)
            for perfil in perfiles
        ],
    )
