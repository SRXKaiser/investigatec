
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ProyectoCrear(BaseModel):
    titulo: str = Field(min_length=3, max_length=255)
    descripcion: str | None = None


class ProyectoActualizar(BaseModel):
    titulo: str | None = Field(
        default=None, min_length=3, max_length=255
    )
    descripcion: str | None = None


class ProyectoRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_proyecto: int
    id_usuario: int
    titulo: str
    descripcion: str | None
    estado: str
    fecha_creacion: datetime
    fecha_actualizacion: datetime
