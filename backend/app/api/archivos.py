
from fastapi import (
    APIRouter,
    Depends,
    File,
    UploadFile,
    HTTPException,
    status,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.auth import obtener_usuario_actual
from app.db.session import get_db
from app.models.usuario import Usuario
from app.schemas.archivo import ArchivoRespuesta
from app.services import archivos as servicio


router = APIRouter(
    prefix="/archivos",
    tags=["Archivos"],
)


@router.post(
    "/proyectos/{id_proyecto}",
    response_model=ArchivoRespuesta,
    status_code=status.HTTP_201_CREATED,
)
def subir_archivo(
    id_proyecto: int,
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obtener_usuario_actual),
):
    try:
        return servicio.guardar_archivo(
            db,
            id_proyecto,
            usuario.id_usuario,
            archivo,
        )
    finally:
        archivo.file.close()


@router.get(
    "/proyectos/{id_proyecto}",
    response_model=list[ArchivoRespuesta],
)
def listar_archivos(
    id_proyecto: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obtener_usuario_actual),
):
    return servicio.listar_archivos(
        db, id_proyecto, usuario.id_usuario
    )


@router.get(
    "/{id_archivo}",
    response_model=ArchivoRespuesta,
)
def consultar_archivo(
    id_archivo: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obtener_usuario_actual),
):
    return servicio.obtener_archivo_propio(
        db, id_archivo, usuario.id_usuario
    )


@router.get("/{id_archivo}/descargar")
def descargar_archivo(
    id_archivo: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obtener_usuario_actual),
):
    archivo, ruta = servicio.ruta_para_descarga(
        db, id_archivo, usuario.id_usuario
    )

    return FileResponse(
        path=ruta,
        filename=archivo.nombre_original,
        media_type=archivo.tipo_mime,
    )


@router.post(
    "/{id_archivo}/versiones",
    response_model=ArchivoRespuesta,
    status_code=status.HTTP_201_CREATED,
)
def subir_nueva_version(
    id_archivo: int,
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obtener_usuario_actual),
):
    anterior = servicio.obtener_archivo_propio(
        db, id_archivo, usuario.id_usuario
    )

    extension_anterior = anterior.nombre_original.rsplit(".", 1)[-1].lower()
    extension_nueva = (
        (archivo.filename or "").rsplit(".", 1)[-1].lower()
    )

    if extension_anterior != extension_nueva:
        raise HTTPException(
            status_code=422,
            detail="La nueva version debe conservar el formato original",
        )

    try:
        return servicio.guardar_archivo(
            db,
            anterior.id_proyecto,
            usuario.id_usuario,
            archivo,
            nombre_documento=anterior.nombre_original,
            nueva_version=True,
        )
    finally:
        archivo.file.close()
