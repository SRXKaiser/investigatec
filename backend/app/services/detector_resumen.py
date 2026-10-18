
import re
from pathlib import Path

from docx import Document
from pypdf import PdfReader


# Encabezados que identifican el inicio del resumen
INICIOS = re.compile(
    r"^\s*(?:\d+(?:\.\d+)*[.)]?\s*)?"
    r"(resumen(?:\s+ejecutivo)?|abstract|summary)"
    r"\s*[:.\-–]?\s*(.*)$",
    re.IGNORECASE,
)

# Encabezados que suelen cerrar la sección
FINES = re.compile(
    r"^\s*(?:\d+(?:\.\d+)*[.)]?\s*)?"
    r"(palabras\s+clave|keywords|key\s+words|"
    r"introducci[oó]n|introduction|"
    r"antecedentes|objetivos?|objectives?|"
    r"metodolog[ií]a|methodology|"
    r"[ií]ndice|tabla\s+de\s+contenido|"
    r"agradecimientos|acknowledg(?:e)?ments|"
    r"referencias|references|bibliograf[ií]a)"
    r"\s*[:.\-–]?(?:\s+.*)?$",
    re.IGNORECASE,
)

MAX_PAGINAS_PDF = 35
MAX_CARACTERES_TEXTO = 250_000
MAX_CARACTERES_RESUMEN = 6_000


def extraer_texto_pdf(ruta: Path) -> str:
    lector = PdfReader(str(ruta), strict=False)
    partes = []
    acumulado = 0

    for pagina in lector.pages[:MAX_PAGINAS_PDF]:
        texto = pagina.extract_text() or ""
        partes.append(texto)
        acumulado += len(texto)

        if acumulado >= MAX_CARACTERES_TEXTO:
            break

    return "\n".join(partes)[:MAX_CARACTERES_TEXTO]


def extraer_texto_docx(ruta: Path) -> str:
    documento = Document(str(ruta))
    partes = []
    acumulado = 0

    for parrafo in documento.paragraphs:
        texto = parrafo.text.strip()

        if texto:
            partes.append(texto)
            acumulado += len(texto)

        if acumulado >= MAX_CARACTERES_TEXTO:
            break

    return "\n".join(partes)[:MAX_CARACTERES_TEXTO]


def detectar_resumen_en_texto(texto: str) -> str | None:
    lineas = texto.splitlines()

    capturando = False
    fragmentos = []
    caracteres = 0

    for linea in lineas:
        linea = " ".join(linea.split())

        if not linea:
            continue

        if not capturando:
            inicio = INICIOS.match(linea)

            if not inicio:
                continue

            # Evitar confundir una línea extensa del índice
            # con el encabezado del resumen.
            if len(linea) > 200:
                continue

            capturando = True
            contenido_inicial = inicio.group(2).strip()

            if contenido_inicial:
                fragmentos.append(contenido_inicial)
                caracteres += len(contenido_inicial)

            continue

        if FINES.match(linea):
            break

        # Evitar absorber otra sección si el documento
        # no tiene encabezados convencionales.
        if re.match(
            r"^\d+(?:\.\d+)*[.)]\s+[A-ZÁÉÍÓÚÑ]",
            linea,
        ):
            break

        fragmentos.append(linea)
        caracteres += len(linea) + 1

        if caracteres >= MAX_CARACTERES_RESUMEN:
            break

    resultado = " ".join(fragmentos).strip()

    # Descartar coincidencias que probablemente
    # no sean resúmenes reales.
    if len(resultado) < 80:
        return None

    return resultado[:MAX_CARACTERES_RESUMEN]


def detectar_resumen(ruta: Path) -> str | None:
    extension = ruta.suffix.lower()

    if extension == ".pdf":
        texto = extraer_texto_pdf(ruta)

    elif extension == ".docx":
        texto = extraer_texto_docx(ruta)

    else:
        return None

    if not texto.strip():
        return None

    return detectar_resumen_en_texto(texto)
