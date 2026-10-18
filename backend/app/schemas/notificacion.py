
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificacionRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_notificacion: int
    id_usuario: int
    titulo: str
    mensaje: str
    leida: bool
    fecha_creacion: datetime
