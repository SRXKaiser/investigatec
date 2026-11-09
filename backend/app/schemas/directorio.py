"""Respuesta del directorio publico de perfiles academicos."""

from pydantic import BaseModel, ConfigDict


class PerfilDirectorioRespuesta(BaseModel):
    id_usuario: int
    username: str
    nombre_publico: str | None
    foto_perfil: str | None
    institucion: str | None
    especialidad: str | None

    model_config = ConfigDict(from_attributes=True)


class DirectorioRespuesta(BaseModel):
    total: int
    limite: int
    offset: int
    resultados: list[PerfilDirectorioRespuesta]
