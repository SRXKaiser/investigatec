from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class EnlaceCrear(BaseModel):
    tipo: str = Field(min_length=1, max_length=50)
    url: HttpUrl
    orden: int = Field(default=0, ge=0)


class EnlaceRespuesta(BaseModel):
    id_enlace: int
    id_perfil: int
    tipo: str
    url: str
    orden: int

    model_config = ConfigDict(from_attributes=True)


class AreaRespuesta(BaseModel):
    id_area: int
    nombre: str

    model_config = ConfigDict(from_attributes=True)


class AreasActualizar(BaseModel):
    ids_areas: list[int] = Field(max_length=20)