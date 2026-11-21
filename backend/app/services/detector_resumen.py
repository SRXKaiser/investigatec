"""Extracción conservadora de la sección Resumen/Abstract en PDF y DOCX.

No genera texto ni resume el documento con IA. Si no se puede localizar una
sección fiable, devuelve None para evitar mostrar apartados incorrectos.
"""

import re
import unicodedata
from pathlib import Path

from docx import Document
from pypdf import PdfReader

# El encabezado debe estar solo en su línea, o contener texto tras ':'/'–'.
# «Resumen de actividades» no es un encabezado de resumen académico.
INICIOS = re.compile(
    r"^(?:\d{1,2}(?:\.\d{1,2}){0,3}[.)]?\s+)?"
    r"(resumen(?:\s+ejecutivo)?|abstract|summary)"
    r"(?:\s*[:–—-]\s*(.*))?\s*$",
    re.IGNORECASE,
)

FINES = re.compile(
    r"^(?:\d{1,2}(?:\.\d+)*[.)]?\s+|[IVXLCDM]+[.)]\s+)?"
    r"(?:palabras\s+clave|palabras\s+claves|keywords|key\s+words|"
    r"introducci[oó]n|introduction|antecedentes|background|"
    r"objetivos?|objectives?|metodolog[ií]a|methodology|"
    r"[ií]ndice|tabla\s+de\s+contenido|agradecimientos|acknowledg(?:e)?ments|"
    r"referencias|references|bibliograf[ií]a|conclusiones|conclusions)"
    r"\s*(?:[:.\-–]\s*)?$",
    re.IGNORECASE,
)

PALABRAS_CLAVE = re.compile(
    r"^(?:palabras\s+claves?|keywords|key\s+words)\s*[:.\-–]",
    re.IGNORECASE,
)

SECCION_NUMERADA = re.compile(
    r"^(?:\d+(?:\.\d+){0,3}[.)]|[IVXLCDM]+[.)])\s+"
    r"[A-ZÁÉÍÓÚÑ][^.!?]{0,105}$"
)

TITULO_CAPITULO = re.compile(
    r"^(?:cap[ií]tulo|chapter|secci[oó]n)\s+[\dIVXLCDM]+\b",
    re.IGNORECASE,
)

PAGINA_INDICE = re.compile(r"(?:\.{3,}|(?:\.\s*){4,}|\s{3,})\d{1,4}\s*$")

MAX_PAGINAS_PDF = 35
MAX_CARACTERES_TEXTO = 250_000
MAX_CARACTERES_RESUMEN = 12_000
MIN_CARACTERES_RESUMEN = 110


def _normalizar(linea: str) -> str:
    return " ".join(unicodedata.normalize("NFKC", linea).split()).strip()


def extraer_texto_pdf(ruta: Path) -> str:
    lector = PdfReader(str(ruta), strict=False)
    partes: list[str] = []
    acumulado = 0
    for numero, pagina in enumerate(lector.pages):
        if numero >= MAX_PAGINAS_PDF or acumulado >= MAX_CARACTERES_TEXTO:
            break
        texto = pagina.extract_text() or ""
        partes.append(texto[:MAX_CARACTERES_TEXTO - acumulado])
        acumulado += len(texto)
    return "\n".join(partes)


def extraer_texto_docx(ruta: Path) -> str:
    documento = Document(str(ruta))
    partes: list[str] = []
    acumulado = 0
    for parrafo in documento.paragraphs:
        texto = parrafo.text.strip()
        if texto:
            partes.append(texto[:MAX_CARACTERES_TEXTO - acumulado])
            acumulado += len(texto)
        if acumulado >= MAX_CARACTERES_TEXTO:
            break
    return "\n".join(partes)


def _parece_indice(lineas: list[str], posicion: int) -> bool:
    siguientes = [linea for linea in lineas[posicion + 1:posicion + 10] if linea]
    if not siguientes:
        return True
    # Las entradas de la tabla de contenido suelen tener puntos y página.
    if sum(bool(PAGINA_INDICE.search(linea)) for linea in siguientes) >= 2:
        return True
    # Si justo después del «Resumen» empiezan varios títulos numerados,
    # se trata casi seguro de un índice, no de un resumen.
    if sum(bool(SECCION_NUMERADA.match(linea)) for linea in siguientes[:6]) >= 2:
        return True
    return False


def _es_fin(linea: str) -> bool:
    return bool(
        FINES.fullmatch(linea)
        or PALABRAS_CLAVE.match(linea)
        or SECCION_NUMERADA.match(linea)
        or TITULO_CAPITULO.match(linea)
    )


def detectar_resumen_en_texto(texto: str) -> str | None:
    lineas = [_normalizar(linea) for linea in texto.splitlines()]
    for indice, linea in enumerate(lineas):
        if not linea or len(linea) > 180 or PAGINA_INDICE.search(linea):
            continue
        inicio = INICIOS.fullmatch(linea)
        if not inicio or _parece_indice(lineas, indice):
            continue

        inline = (inicio.group(2) or "").strip()
        if inline and len(inline) < 35:
            # «Resumen: páginas 1-3» no es texto académico.
            continue

        partes = [inline] if inline else []
        caracteres = len(inline)
        encontro_fin = False
        for siguiente in lineas[indice + 1:]:
            if not siguiente:
                continue
            if _es_fin(siguiente):
                encontro_fin = True
                break
            if PAGINA_INDICE.search(siguiente):
                # Si aparece un índice dentro del contenido, no confiar.
                partes = []
                break
            caracteres += len(siguiente) + 1
            if caracteres > MAX_CARACTERES_RESUMEN:
                # Un bloque sin fin mayor de 12k caracteres suele ser otro
                # apartado. No devolver texto truncado como si fuese completo.
                partes = []
                break
            partes.append(siguiente)

        resumen = " ".join(partes).strip()
        if len(resumen) < MIN_CARACTERES_RESUMEN:
            continue
        # Los resúmenes normalmente son prosa; rechazar listados/índices.
        if len(re.findall(r"[.!?](?:\s|$)", resumen)) < 2:
            continue
        if not encontro_fin and len(resumen) > 8_000:
            continue
        return resumen

    return None


def detectar_resumen(ruta: Path) -> str | None:
    extension = ruta.suffix.lower()
    if extension == ".pdf":
        texto = extraer_texto_pdf(ruta)
    elif extension == ".docx":
        texto = extraer_texto_docx(ruta)
    else:
        return None
    return detectar_resumen_en_texto(texto) if texto.strip() else None
