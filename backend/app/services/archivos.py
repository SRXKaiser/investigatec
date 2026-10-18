from pathlib import Path
from uuid import uuid4
from zipfile import ZipFile, BadZipFile
import os

from fastapi import HTTPException, UploadFile
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.archivo import Archivo
from app.models.proyecto import Proyecto

import logging
from app.services.detector_resumen import detectar_resumen
logger = logging.getLogger(__name__)
CARPETA_STORAGE = Path("/code/storage")
TAMANO_MAXIMO = 500 * 1024 * 1024  # 500 MB

TIPOS_PERMITIDOS = {
    ".pdf": "application/pdf",
    ".docx": (
        "application/vnd.openxmlformats-officedocument."
        "wordprocessingml.document"
    ),
}


def obtener_proyecto_propio(
    db: Session, id_proyecto: int, id_usuario: int
):
    proyecto = db.scalar(
        select(Proyecto).where(
            Proyecto.id_proyecto == id_proyecto,
            Proyecto.id_usuario == id_usuario,
        )
    )

    if proyecto is None:
        raise HTTPException(
            status_code=404,
            detail="Proyecto no encontrado",
        )

    return proyecto


def obtener_archivo_propio(
    db: Session, id_archivo: int, id_usuario: int
):
    archivo = db.get(Archivo, id_archivo)

    if archivo is None:
        raise HTTPException(
            status_code=404,
            detail="Archivo no encontrado",
        )

    obtener_proyecto_propio(
        db, archivo.id_proyecto, id_usuario
    )

    return archivo


def validar_contenido(ruta: Path, extension: str):
    try:
        if extension == ".pdf":
            with ruta.open("rb") as f:
                if f.read(5) != b"%PDF-":
                    raise ValueError("PDF invalido")

        elif extension == ".docx":
            with ZipFile(ruta) as documento:
                if (
                    "[Content_Types].xml" not in documento.namelist()
                    or "word/document.xml" not in documento.namelist()
                ):
                    raise ValueError("DOCX invalido")

    except (BadZipFile, ValueError, OSError):
        raise HTTPException(
            status_code=422,
            detail="El contenido no corresponde a un PDF o DOCX valido",
        )


def guardar_contenido(archivo: UploadFile, destino: Path):
    total = 0

    with destino.open("wb") as salida:
        while True:
            bloque = archivo.file.read(1024 * 1024)

            if not bloque:
                break

            total += len(bloque)

            if total > TAMANO_MAXIMO:
                raise HTTPException(
                    status_code=413,
                    detail="El archivo supera el limite de 500 MB",
                )

            salida.write(bloque)

    if total == 0:
        raise HTTPException(
            status_code=422,
            detail="No se permiten archivos vacios",
        )


def guardar_archivo(
    db: Session,
    id_proyecto: int,
    id_usuario: int,
    archivo_subido: UploadFile,
    nombre_documento: str | None = None,
    nueva_version: bool = False,
):
    proyecto = obtener_proyecto_propio(
        db, id_proyecto, id_usuario
    )

    if proyecto.estado not in ("BORRADOR", "CORRECCIONES"):
        raise HTTPException(
            status_code=409,
            detail="El proyecto no permite subir documentos",
        )

    nombre_recibido = archivo_subido.filename or ""

    # Eliminar posibles rutas enviadas en el nombre
    nombre_recibido = nombre_recibido.replace("\\", "/").split("/")[-1]

    if not nombre_recibido or len(nombre_recibido) > 255:
        raise HTTPException(
            status_code=422,
            detail="Nombre de archivo invalido",
        )

    extension = Path(nombre_recibido).suffix.lower()

    if extension not in TIPOS_PERMITIDOS:
        raise HTTPException(
            status_code=415,
            detail="Solo se permiten archivos PDF y DOCX",
        )

    nombre = nombre_documento or nombre_recibido

    version_actual = db.scalar(
        select(func.max(Archivo.version)).where(
            Archivo.id_proyecto == id_proyecto,
            Archivo.nombre_original == nombre,
        )
    )

    if version_actual is not None and not nueva_version:
        raise HTTPException(
            status_code=409,
            detail="El documento ya existe; utiliza el endpoint de versiones",
        )

    if nueva_version and version_actual is None:
        raise HTTPException(
            status_code=404,
            detail="No existe una version anterior",
        )

    siguiente_version = (version_actual or 0) + 1

    carpeta = CARPETA_STORAGE / str(id_proyecto)
    carpeta.mkdir(parents=True, exist_ok=True)

    destino = carpeta / f"{uuid4().hex}{extension}"

    try:
        guardar_contenido(archivo_subido, destino)
        validar_contenido(destino, extension)
        resumen = None

        try:
            resumen = detectar_resumen(destino)
        except Exception:
            logger.exception(
                "No se pudo extraer el resumen del archivo %s",
                destino.name,
            )

        nuevo = Archivo(
            id_proyecto=id_proyecto,
            nombre_original=nombre,
            ruta_almacenamiento=str(destino),
            tipo_mime=TIPOS_PERMITIDOS[extension],
            version=siguiente_version,
            resumen_detectado=resumen,
        )

        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)

        return nuevo

    except Exception:
        db.rollback()
        destino.unlink(missing_ok=True)
        raise


def listar_archivos(
    db: Session, id_proyecto: int, id_usuario: int
):
    obtener_proyecto_propio(db, id_proyecto, id_usuario)

    return db.scalars(
        select(Archivo)
        .where(Archivo.id_proyecto == id_proyecto)
        .order_by(
            Archivo.nombre_original,
            Archivo.version.desc(),
        )
    ).all()


def ruta_para_descarga(
    db: Session, id_archivo: int, id_usuario: int
):
    archivo = obtener_archivo_propio(
        db, id_archivo, id_usuario
    )

    ruta = Path(archivo.ruta_almacenamiento).resolve()
    raiz = CARPETA_STORAGE.resolve()

    if not ruta.is_relative_to(raiz):
        raise HTTPException(
            status_code=500,
            detail="Ruta de almacenamiento invalida",
        )

    if not ruta.is_file():
        raise HTTPException(
            status_code=404,
            detail="El archivo fisico no existe",
        )

    return archivo, ruta
