
from io import BytesIO
from pathlib import Path
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
)
from fastapi.responses import FileResponse
from PIL import Image, ImageOps, UnidentifiedImageError
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.auth import obtener_usuario_actual
from app.core.permissions import tiene_rol
from app.db.session import get_db
from app.models.usuario import Usuario
from app.models.perfil import Perfil
from app.schemas.perfil import (
    PerfilActualizar,
    PerfilRespuesta,
    PerfilPublicoRespuesta,
)


router = APIRouter(
    prefix="/perfiles",
    tags=["Perfiles academicos"],
)

STORAGE = Path("/code/storage/perfiles")
MAX_FOTO_BYTES = 5 * 1024 * 1024
MAX_PIXELES = 20_000_000

FORMATOS_PERMITIDOS = {
    "JPEG",
    "PNG",
    "WEBP",
}

Image.MAX_IMAGE_PIXELS = MAX_PIXELES


def buscar_perfil(
    db: Session,
    id_usuario: int,
) -> Perfil:
    perfil = db.scalar(
        select(Perfil).where(
            Perfil.id_usuario == id_usuario
        )
    )

    if perfil is None:
        raise HTTPException(
            status_code=404,
            detail="Perfil no encontrado",
        )

    return perfil


def verificar_acceso(
    db: Session,
    perfil: Perfil,
    usuario: Usuario,
):
    if perfil.id_usuario == usuario.id_usuario:
        return

    if tiene_rol(
        db,
        usuario.id_usuario,
        "ADMIN",
    ):
        return

    if not perfil.perfil_visible:
        raise HTTPException(
            status_code=404,
            detail="Perfil no disponible",
        )

    propietario = db.get(
        Usuario,
        perfil.id_usuario,
    )

    if propietario is None or not propietario.activo:
        raise HTTPException(
            status_code=404,
            detail="Perfil no disponible",
        )


def respuesta_publica(perfil: Perfil):
    return {
        "id_usuario": perfil.id_usuario,
        "username": perfil.username,
        "nombre_publico": perfil.nombre_publico,
        "biografia": perfil.biografia,
        "foto_perfil": perfil.foto_perfil,
        "institucion": perfil.institucion,
        "especialidad": perfil.especialidad,
    }


def archivo_foto(perfil: Perfil) -> Path | None:
    if not perfil.foto_perfil:
        return None

    # El nombre siempre se genera en el servidor.
    nombre = perfil.foto_perfil.rsplit("/", 1)[-1]

    if (
        not nombre.startswith("foto_")
        or not nombre.endswith(".jpg")
        or "/" in nombre
        or "\\" in nombre
    ):
        return None

    return STORAGE / str(perfil.id_usuario) / nombre


@router.get(
    "/me",
    response_model=PerfilRespuesta,
)
def obtener_mi_perfil(
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    return buscar_perfil(
        db,
        usuario.id_usuario,
    )


@router.patch(
    "/me",
    response_model=PerfilRespuesta,
)
def actualizar_mi_perfil(
    datos: PerfilActualizar,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    perfil = buscar_perfil(
        db,
        usuario.id_usuario,
    )

    cambios = datos.model_dump(
        exclude_unset=True,
    )

    if "username" in cambios:
        nuevo_username = cambios["username"]

        if nuevo_username is None:
            raise HTTPException(
                status_code=422,
                detail="El username no puede ser nulo",
            )

        existe = db.scalar(
            select(Perfil.id_perfil).where(
                func.lower(Perfil.username)
                == nuevo_username.lower(),
                Perfil.id_perfil != perfil.id_perfil,
            )
        )

        if existe is not None:
            raise HTTPException(
                status_code=409,
                detail="El username ya esta en uso",
            )

    for campo, valor in cambios.items():
        setattr(perfil, campo, valor)

    try:
        db.commit()
        db.refresh(perfil)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="El username ya esta en uso",
        )

    return perfil


@router.get(
    "/{id_usuario}",
    response_model=PerfilPublicoRespuesta,
)
def consultar_perfil(
    id_usuario: int,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    perfil = buscar_perfil(
        db,
        id_usuario,
    )

    verificar_acceso(
        db,
        perfil,
        usuario,
    )

    return respuesta_publica(perfil)


@router.put(
    "/me/foto",
    response_model=PerfilRespuesta,
)
async def actualizar_foto_perfil(
    foto: UploadFile = File(...),
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    perfil = buscar_perfil(
        db,
        usuario.id_usuario,
    )

    if foto.content_type not in {
        "image/jpeg",
        "image/png",
        "image/webp",
    }:
        raise HTTPException(
            status_code=415,
            detail="Solo se permiten JPG, PNG y WebP",
        )

    contenido = await foto.read(
        MAX_FOTO_BYTES + 1
    )
    await foto.close()

    if len(contenido) > MAX_FOTO_BYTES:
        raise HTTPException(
            status_code=413,
            detail="La fotografia no debe superar 5 MB",
        )

    if not contenido:
        raise HTTPException(
            status_code=422,
            detail="La fotografia esta vacia",
        )

    try:
        with Image.open(BytesIO(contenido)) as original:
            if original.format not in FORMATOS_PERMITIDOS:
                raise ValueError("Formato no permitido")

            if original.width * original.height > MAX_PIXELES:
                raise ValueError("Imagen demasiado grande")

            imagen = ImageOps.exif_transpose(original)
            imagen.load()

            if imagen.mode in ("RGBA", "LA"):
                fondo = Image.new(
                    "RGB",
                    imagen.size,
                    "white",
                )
                fondo.paste(
                    imagen.convert("RGBA"),
                    mask=imagen.convert("RGBA").getchannel("A"),
                )
                imagen = fondo
            else:
                imagen = imagen.convert("RGB")

            imagen.thumbnail(
                (1024, 1024),
                Image.Resampling.LANCZOS,
            )

            salida = BytesIO()
            imagen.save(
                salida,
                format="JPEG",
                quality=85,
                optimize=True,
            )

            contenido_final = salida.getvalue()

    except (
        UnidentifiedImageError,
        OSError,
        ValueError,
        Image.DecompressionBombError,
    ):
        raise HTTPException(
            status_code=422,
            detail="La imagen no es valida",
        )

    carpeta = STORAGE / str(usuario.id_usuario)
    carpeta.mkdir(
        parents=True,
        exist_ok=True,
    )

    nombre = f"foto_{uuid4().hex}.jpg"
    destino = carpeta / nombre

    foto_anterior = archivo_foto(perfil)

    try:
        destino.write_bytes(contenido_final)

        perfil.foto_perfil = (
            f"/perfiles/{usuario.id_usuario}/foto/{nombre}"
        )

        db.commit()
        db.refresh(perfil)

    except Exception:
        db.rollback()
        destino.unlink(missing_ok=True)
        raise

    if foto_anterior is not None:
        if foto_anterior != destino:
            foto_anterior.unlink(missing_ok=True)

    return perfil


@router.delete(
    "/me/foto",
    status_code=204,
)
def eliminar_foto_perfil(
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    perfil = buscar_perfil(
        db,
        usuario.id_usuario,
    )

    anterior = archivo_foto(perfil)

    perfil.foto_perfil = None

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    if anterior is not None:
        anterior.unlink(missing_ok=True)


@router.get(
    "/{id_usuario}/foto/{nombre_archivo}",
)
def obtener_foto_perfil(
    id_usuario: int,
    nombre_archivo: str,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    perfil = buscar_perfil(
        db,
        id_usuario,
    )

    verificar_acceso(
        db,
        perfil,
        usuario,
    )

    ruta = archivo_foto(perfil)

    if (
        ruta is None
        or ruta.name != nombre_archivo
        or not ruta.is_file()
    ):
        raise HTTPException(
            status_code=404,
            detail="Fotografia no encontrada",
        )

    return FileResponse(
        path=ruta,
        media_type="image/jpeg",
        headers={
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
        },
    )
