
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class RevisionAsignar(BaseModel):
    id_archivo: int
    id_revisor: int


class RevisionDecidir(BaseModel):
    resultado: Literal["APROBADO", "CORRECCIONES"]
    comentario: str | None = Field(
        default=None,
        max_length=5000,
    )


class RevisionRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_revision: int
    id_archivo: int
    id_revisor: int
    estado: str
    observaciones: str | None
    fecha_asignacion: datetime
    fecha_revision: datetime | None


class DecisionRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_decision: int
    id_revision: int
    resultado: str
    comentario: str | None
    fecha_decision: datetime


class HistorialRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_historial: int
    id_proyecto: int
    estado_anterior: str | None
    estado_nuevo: str
    id_usuario: int
    fecha_cambio: datetime
