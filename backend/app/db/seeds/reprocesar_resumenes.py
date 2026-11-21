import argparse
import logging
from pathlib import Path

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.archivo import Archivo
from app.services.archivos import CARPETA_STORAGE
from app.services.detector_resumen import detectar_resumen

logger = logging.getLogger(__name__)


def main() -> None:
    parser = argparse.ArgumentParser(description="Recalcula resúmenes de PDF/DOCX")
    accion = parser.add_mutually_exclusive_group(required=True)
    accion.add_argument("--apply", action="store_true", help="Actualizar la base de datos")
    accion.add_argument("--dry-run", action="store_true", help="Solo comprobar; sin cambios")
    parser.add_argument("--limit", type=int, default=0, help="Máximo de archivos (0 = todos)")
    args = parser.parse_args()

    raiz = CARPETA_STORAGE.resolve()
    revisados = cambios = no_encontrados = errores = 0
    with SessionLocal() as db:
        consulta = select(Archivo).order_by(Archivo.id_archivo)
        if args.limit > 0:
            consulta = consulta.limit(args.limit)
        for archivo in db.scalars(consulta).all():
            ruta = Path(archivo.ruta_almacenamiento).resolve()
            if not ruta.is_relative_to(raiz) or not ruta.is_file():
                errores += 1
                logger.warning("Archivo %s no accesible o fuera del almacenamiento", archivo.id_archivo)
                continue
            try:
                nuevo = detectar_resumen(ruta)
            except Exception:
                errores += 1
                logger.exception("No se pudo procesar el ID %s", archivo.id_archivo)
                continue
            revisados += 1
            if nuevo is None:
                no_encontrados += 1
            if nuevo != archivo.resumen_detectado:
                cambios += 1
                if args.apply:
                    archivo.resumen_detectado = nuevo
                    db.commit()
    modo = "APLICADO" if args.apply else "SIMULACIÓN"
    print(f"{modo}: revisados={revisados} cambios={cambios} sin_resumen={no_encontrados} errores={errores}")


if __name__ == "__main__":
    main()
