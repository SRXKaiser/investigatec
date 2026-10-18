from pydantic import BaseModel, ConfigDict, Field


class PerfilActualizar(BaseModel):
    nombre_publico: str | None = Field(
        default=None, max_length=150
    )

    biografia: str | None = None

    institucion: str | None = Field(
        default=None, max_length=150
    )

    especialidad: str | None = Field(
        default=None, max_length=150
    )

    perfil_visible: bool | None = None


class PerfilRespuesta(BaseModel):
    id_perfil: int
    id_usuario: int
    username: str
    nombre_publico: str | None
    biografia: str | None
    foto_perfil: str | None
    foto_portada: str | None
    institucion: str | None
    especialidad: str | None
    perfil_visible: bool

    model_config = ConfigDict(from_attributes=True)