
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AsignacionRevisorCrear(BaseModel):
    id_revisor: int


class AsignacionRevisorRespuesta(BaseModel):
    id_investigador: int
    id_revisor: int
    asignado_por: int
    fecha_asignacion: datetime

    model_config = ConfigDict(from_attributes=True)
