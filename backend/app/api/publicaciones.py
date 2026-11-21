"""Consulta de metadatos bibliográficos mediante la API pública de Crossref.

No requiere credenciales y no permite elegir el servidor de destino.
"""

import re
from urllib.parse import quote

import httpx
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

router = APIRouter(prefix="/publicaciones", tags=["Publicaciones externas"])
PATRON_DOI = re.compile(r"^10\.\d{4,9}/\S+$", re.IGNORECASE)


class PublicacionDOI(BaseModel):
    doi: str
    titulo: str
    revista: str | None
    anio: int | None
    autores: list[str]
    url: str
    fuente: str = "Crossref"


@router.get("/doi", response_model=PublicacionDOI)
async def consultar_doi(doi: str = Query(min_length=7, max_length=200)):
    """Obtiene título, autores, revista y año de una publicación por DOI."""
    doi = doi.strip()
    if not PATRON_DOI.fullmatch(doi):
        raise HTTPException(422, "Introduce un DOI válido, por ejemplo 10.1038/nphys1170")

    try:
        async with httpx.AsyncClient(timeout=8, follow_redirects=False) as cliente:
            respuesta = await cliente.get(
                f"https://api.crossref.org/works/{quote(doi, safe='')}",
                headers={"User-Agent": "InvestigaTec/2.0 (consulta académica)"},
            )
        if respuesta.status_code == 404:
            raise HTTPException(404, "DOI no encontrado en Crossref")
        respuesta.raise_for_status()
        cuerpo = respuesta.json()
        registro = cuerpo.get("message", {}) if isinstance(cuerpo, dict) else {}
        if not isinstance(registro, dict):
            raise ValueError("Respuesta de Crossref no válida")
    except HTTPException:
        raise
    except (httpx.HTTPError, ValueError, KeyError, TypeError) as exc:
        raise HTTPException(
            503, "No se pudo consultar Crossref. Inténtalo más tarde."
        ) from exc

    def primero(valor):
        return valor[0] if isinstance(valor, list) and valor else None

    autores = []
    autores_origen = registro.get("author")
    for autor in (autores_origen if isinstance(autores_origen, list) else [])[:15]:
        if not isinstance(autor, dict):
            continue
        nombre = " ".join(filter(None, [autor.get("given"), autor.get("family")]))
        if nombre:
            autores.append(nombre)
    publicado = registro.get("published") or registro.get("issued") or {}
    partes = primero(publicado.get("date-parts")) if isinstance(publicado, dict) else None
    anio = partes[0] if isinstance(partes, list) and partes and isinstance(partes[0], int) else None

    return PublicacionDOI(
        doi=registro.get("DOI") or doi,
        titulo=primero(registro.get("title")) or "Título no disponible",
        revista=primero(registro.get("container-title")),
        anio=anio,
        autores=autores,
        url=f"https://doi.org/{quote(doi, safe='/')}",
    )
