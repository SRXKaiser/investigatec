from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UsuarioRegistro(BaseModel):
    nombre: str = Field(min_length=1, max_length=100)
    apellido_paterno: str = Field(min_length=1, max_length=100)
    apellido_materno: str | None = Field(default=None, max_length=100)
    correo: EmailStr
    password: str = Field(min_length=12, max_length=128)


class UsuarioLogin(BaseModel):
    correo: EmailStr
    password: str


class UsuarioRespuesta(BaseModel):
    id_usuario: int
    nombre: str
    apellido_paterno: str
    apellido_materno: str | None
    correo: EmailStr
    activo: bool
    fecha_registro: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenRespuesta(BaseModel):
    access_token: str
    token_type: str = "bearer"