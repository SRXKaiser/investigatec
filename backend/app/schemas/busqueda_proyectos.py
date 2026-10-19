
from pydantic import BaseModel, Field

from app.schemas.proyecto import ProyectoRespuesta


class BusquedaProyectosRespuesta(BaseModel):
    total: int = Field(ge=0)
    pagina: int = Field(ge=1)
    limite: int = Field(ge=1)
    total_paginas: int = Field(ge=0)
    resultados: list[ProyectoRespuesta]
