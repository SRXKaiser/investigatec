
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RolRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_rol: int
    nombre: str
    descripcion: str | None = None


class AsignarRolSolicitud(BaseModel):
    id_usuario: int = Field(gt=0)
    id_rol: int = Field(gt=0)


class UsuarioRolRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_usuario: int
    id_rol: int
    asignado_por: int | None = None
    fecha_asignacion: datetime
