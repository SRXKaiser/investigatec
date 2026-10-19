
from pathlib import Path
from uuid import uuid4
from zipfile import ZipFile, BadZipFile
import logging

from fastapi import HTTPException, UploadFile
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.archivo import Archivo
from app.models.documento import Documento
from app.models.proyecto import Proyecto
from app.models.revision import Revision
from app.services.detector_resumen import detectar_resumen
from app.services.estados import actualizar_estado_proyecto
from app.core.permissions import tiene_rol


logger = logging.getLogger(__name__)

CARPETA_STORAGE = Path("/code/storage")
TAMANO_MAXIMO = 500 * 1024 * 1024

TIPOS_PERMITIDOS = {
    ".pdf": "application/pdf",
    ".docx": (
        "application/vnd.openxmlformats-officedocument."
        "wordprocessingml.document"
    ),
}


def obtener_proyecto_propio(
    db: Session,
    id_proyecto: int,
    id_usuario: int,
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
            detail="Proyecto propio no encontrado",
        )

    return proyecto


def obtener_proyecto_para_escritura(
    db: Session,
    id_proyecto: int,
    id_usuario: int,
):
    proyecto = db.get(Proyecto, id_proyecto)

    if proyecto is None:
        raise HTTPException(
            status_code=404,
            detail="Proyecto no encontrado",
        )

    if (
        proyecto.id_usuario != id_usuario
        and not tiene_rol(db, id_usuario, "ADMIN")
    ):
        raise HTTPException(
            status_code=403,
            detail="No tienes permisos para subir documentos",
        )

    return proyecto


def puede_leer_archivo(
    db: Session,
    archivo: Archivo,
    id_usuario: int,
) -> bool:
    proyecto = db.get(Proyecto, archivo.id_proyecto)

    if proyecto is None:
        return False

    if proyecto.id_usuario == id_usuario:
        return True

    if tiene_rol(db, id_usuario, "ADMIN"):
        return True

    revision = db.scalar(
        select(Revision.id_revision)
        .where(
            Revision.id_archivo == archivo.id_archivo,
            Revision.id_revisor == id_usuario,
        )
        .limit(1)
    )

    return revision is not None


def obtener_archivo_para_lectura(
    db: Session,
    id_archivo: int,
    id_usuario: int,
):
    archivo = db.get(Archivo, id_archivo)

    if archivo is None or not puede_leer_archivo(
        db, archivo, id_usuario
    ):
        raise HTTPException(
            status_code=404,
            detail="Archivo no encontrado o sin acceso",
        )

    return archivo


def obtener_archivo_propio(
    db: Session,
    id_archivo: int,
    id_usuario: int,
):
    archivo = db.get(Archivo, id_archivo)

    if archivo is None:
        raise HTTPException(
            status_code=404,
            detail="Archivo no encontrado",
        )

    obtener_proyecto_para_escritura(
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


def guardar_contenido(
    archivo: UploadFile,
    destino: Path,
):
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


def obtener_documento(
    db: Session,
    id_documento: int,
    id_proyecto: int | None = None,
):
    consulta = select(Documento).where(
        Documento.id_documento == id_documento
    )

    if id_proyecto is not None:
        consulta = consulta.where(
            Documento.id_proyecto == id_proyecto
        )

    return db.scalar(consulta)


def obtener_ultima_version(
    db: Session,
    id_proyecto: int,
    nombre_documento: str | None = None,
    id_documento: int | None = None,
):
    consulta = select(Archivo).where(
        Archivo.id_proyecto == id_proyecto
    )

    if id_documento is not None:
        consulta = consulta.where(
            Archivo.id_documento == id_documento
        )
    elif nombre_documento is not None:
        consulta = consulta.where(
            Archivo.nombre_original == nombre_documento
        )
    else:
        raise ValueError(
            "Se requiere id_documento o nombre_documento"
        )

    return db.scalar(
        consulta.order_by(
            Archivo.version.desc(),
            Archivo.id_archivo.desc(),
        ).limit(1)
    )


def obtener_ultima_revision(
    db: Session,
    id_archivo: int,
):
    return db.scalar(
        select(Revision)
        .where(Revision.id_archivo == id_archivo)
        .order_by(
            Revision.fecha_asignacion.desc(),
            Revision.id_revision.desc(),
        )
        .limit(1)
    )


def existe_revision_pendiente(
    db: Session,
    id_proyecto: int,
    nombre_documento: str | None = None,
    id_documento: int | None = None,
) -> bool:
    consulta = (
        select(Revision.id_revision)
        .join(
            Archivo,
            Archivo.id_archivo == Revision.id_archivo,
        )
        .where(
            Archivo.id_proyecto == id_proyecto,
            Revision.estado == "PENDIENTE",
        )
    )

    if id_documento is not None:
        consulta = consulta.where(
            Archivo.id_documento == id_documento
        )
    elif nombre_documento is not None:
        consulta = consulta.where(
            Archivo.nombre_original == nombre_documento
        )
    else:
        raise ValueError(
            "Se requiere id_documento o nombre_documento"
        )

    return db.scalar(consulta.limit(1)) is not None


def guardar_archivo(
    db: Session,
    id_proyecto: int,
    id_usuario: int,
    archivo_subido: UploadFile,
    nombre_documento: str | None = None,
    nueva_version: bool = False,
    id_documento: int | None = None,
):
    destino = None

    try:
        proyecto = db.scalar(
            select(Proyecto)
            .where(
                Proyecto.id_proyecto == id_proyecto
            )
            .with_for_update()
        )

        if proyecto is None:
            raise HTTPException(
                status_code=404,
                detail="Proyecto no encontrado",
            )

        if (
            proyecto.id_usuario != id_usuario
            and not tiene_rol(db, id_usuario, "ADMIN")
        ):
            raise HTTPException(
                status_code=403,
                detail="No tienes permisos para subir documentos",
            )

        nombre_recibido = archivo_subido.filename or ""
        nombre_recibido = (
            nombre_recibido.replace("\\", "/").split("/")[-1]
        )

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

        if len(nombre) > 255:
            raise HTTPException(
                status_code=422,
                detail="Nombre de documento invalido",
            )

        documento = None
        ultima_version = None

        if nueva_version:
            if id_documento is None:
                raise HTTPException(
                    status_code=422,
                    detail=(
                        "Se requiere id_documento para "
                        "crear una nueva version"
                    ),
                )

            documento = obtener_documento(
                db,
                id_documento,
                id_proyecto,
            )

            if documento is None:
                raise HTTPException(
                    status_code=404,
                    detail="Documento no encontrado",
                )

            ultima_version = obtener_ultima_version(
                db,
                id_proyecto,
                id_documento=id_documento,
            )

            if ultima_version is None:
                raise HTTPException(
                    status_code=404,
                    detail="No existe una version anterior",
                )

            nombre = ultima_version.nombre_original

            if existe_revision_pendiente(
                db,
                id_proyecto,
                id_documento=id_documento,
            ):
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "El documento tiene una revision pendiente. "
                        "Espera la decision del revisor."
                    ),
                )

            revision_anterior = obtener_ultima_revision(
                db,
                ultima_version.id_archivo,
            )

            if (
                revision_anterior is not None
                and revision_anterior.estado == "APROBADO"
            ):
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "El documento ya esta aprobado. "
                        "No se puede sustituir mediante correcciones."
                    ),
                )

            extension_anterior = Path(
                ultima_version.nombre_original
            ).suffix.lower()

            if extension != extension_anterior:
                raise HTTPException(
                    status_code=422,
                    detail=(
                        "La nueva version debe conservar "
                        "el formato original"
                    ),
                )

        else:
            if id_documento is not None:
                raise HTTPException(
                    status_code=422,
                    detail=(
                        "Para utilizar un documento existente "
                        "debes usar el endpoint de versiones"
                    ),
                )

            documento_existente = db.scalar(
                select(Documento.id_documento)
                .where(
                    Documento.id_proyecto == id_proyecto,
                    Documento.nombre == nombre,
                )
                .limit(1)
            )

            if documento_existente is not None:
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "El documento ya existe; "
                        "utiliza el endpoint de versiones"
                    ),
                )

            documento = Documento(
                id_proyecto=id_proyecto,
                nombre=nombre,
            )

            db.add(documento)
            db.flush()

        siguiente_version = (
            ultima_version.version + 1
            if ultima_version is not None
            else 1
        )

        carpeta = CARPETA_STORAGE / str(id_proyecto)
        carpeta.mkdir(parents=True, exist_ok=True)

        destino = carpeta / f"{uuid4().hex}{extension}"

        guardar_contenido(
            archivo_subido,
            destino,
        )

        validar_contenido(
            destino,
            extension,
        )

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
            id_documento=documento.id_documento,
            nombre_original=nombre,
            ruta_almacenamiento=str(destino),
            tipo_mime=TIPOS_PERMITIDOS[extension],
            version=siguiente_version,
            resumen_detectado=resumen,
        )

        db.add(nuevo)
        db.flush()

        actualizar_estado_proyecto(
            db,
            proyecto,
            id_usuario,
        )

        db.commit()
        db.refresh(nuevo)

        return nuevo

    except Exception:
        db.rollback()

        if destino is not None:
            destino.unlink(missing_ok=True)

        raise


def listar_archivos(
    db: Session,
    id_proyecto: int,
    id_usuario: int,
):
    proyecto = db.get(Proyecto, id_proyecto)

    if proyecto is None:
        raise HTTPException(
            status_code=404,
            detail="Proyecto no encontrado",
        )

    consulta = select(Archivo).where(
        Archivo.id_proyecto == id_proyecto
    )

    if (
        proyecto.id_usuario != id_usuario
        and not tiene_rol(db, id_usuario, "ADMIN")
    ):
        archivos_asignados = (
            select(Revision.id_archivo)
            .where(
                Revision.id_revisor == id_usuario
            )
        )

        consulta = consulta.where(
            Archivo.id_archivo.in_(
                archivos_asignados
            )
        )

        existe_asignacion = db.scalar(
            select(Revision.id_revision)
            .join(
                Archivo,
                Archivo.id_archivo == Revision.id_archivo,
            )
            .where(
                Archivo.id_proyecto == id_proyecto,
                Revision.id_revisor == id_usuario,
            )
            .limit(1)
        )

        if existe_asignacion is None:
            raise HTTPException(
                status_code=404,
                detail="Proyecto no encontrado o sin acceso",
            )

    return db.scalars(
        consulta.order_by(
            Archivo.id_documento,
            Archivo.version.desc(),
        )
    ).all()


def ruta_para_descarga(
    db: Session,
    id_archivo: int,
    id_usuario: int,
):
    archivo = obtener_archivo_para_lectura(
        db,
        id_archivo,
        id_usuario,
    )

    ruta = Path(
        archivo.ruta_almacenamiento
    ).resolve()

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
