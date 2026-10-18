from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class RolRespuesta(BaseModel):
    id_rol: int
    nombre: str
    descripcion: str | None


class AsignarRol(BaseModel):
    id_rol: int = Field(gt=0)


class UsuarioAdminRespuesta(BaseModel):
    id_usuario: int
    nombre: str
    apellido_paterno: str
    correo: EmailStr
    activo: bool
    roles: list[str]


class EstadoUsuario(BaseModel):
    activo: bool


class AuditoriaRespuesta(BaseModel):
    id_auditoria: int
    id_usuario: int
    accion: str
    entidad: str
    id_registro: int | None
    fecha_evento: datetime