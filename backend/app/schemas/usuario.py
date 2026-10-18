
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UsuarioBase(BaseModel):
    nombre: str = Field(min_length=1, max_length=100)
    apellido_paterno: str = Field(min_length=1, max_length=100)
    apellido_materno: str | None = Field(default=None, max_length=100)
    correo: EmailStr


class UsuarioRespuesta(UsuarioBase):
    model_config = ConfigDict(from_attributes=True)

    id_usuario: int
    activo: bool
    fecha_registro: datetime
    ultimo_acceso: datetime | None = None
