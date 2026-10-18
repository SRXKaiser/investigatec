
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ArchivoRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_archivo: int
    id_proyecto: int
    nombre_original: str
    tipo_mime: str
    version: int
    resumen_detectado: str | None
    fecha_subida: datetime
