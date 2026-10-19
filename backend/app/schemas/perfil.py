
import re

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
)


class PerfilActualizar(BaseModel):
    nombre_publico: str | None = Field(
        default=None,
        max_length=150,
    )

    username: str | None = Field(
        default=None,
        min_length=3,
        max_length=50,
    )

    biografia: str | None = Field(
        default=None,
        max_length=5000,
    )

    institucion: str | None = Field(
        default=None,
        max_length=150,
    )

    especialidad: str | None = Field(
        default=None,
        max_length=150,
    )

    perfil_visible: bool | None = None

    @field_validator("username")
    @classmethod
    def validar_username(cls, valor):
        if valor is None:
            return None

        valor = valor.strip().lower()

        if not re.fullmatch(
            r"[a-z0-9_]{3,50}",
            valor,
        ):
            raise ValueError(
                "El username debe tener entre 3 y 50 "
                "caracteres: letras sin acentos, "
                "numeros o guion bajo."
            )

        return valor

    @field_validator("nombre_publico")
    @classmethod
    def validar_nombre_publico(cls, valor):
        if valor is None:
            return None

        valor = " ".join(valor.split())

        if not valor:
            raise ValueError(
                "El nombre publico no puede estar vacio"
            )

        return valor

    @field_validator("perfil_visible")
    @classmethod
    def validar_visibilidad(cls, valor):
        if valor is None:
            raise ValueError(
                "La visibilidad debe ser true o false"
            )

        return valor


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


class PerfilPublicoRespuesta(BaseModel):
    id_usuario: int
    username: str
    nombre_publico: str | None
    biografia: str | None
    foto_perfil: str | None
    institucion: str | None
    especialidad: str | None

    model_config = ConfigDict(from_attributes=True)
