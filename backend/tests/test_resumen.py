from app.services.detector_resumen import detectar_resumen_en_texto

PROSA = (
    "Este estudio desarrolla un sistema destinado a organizar trabajos de investigación académica. "
    "Sus resultados indican que el seguimiento de las revisiones mejora la colaboración institucional."
)


def test_resumen_correcto():
    texto = f"PORTADA\nRESUMEN\n{PROSA}\nPalabras clave: investigación, sistemas\nIntroducción"
    assert detectar_resumen_en_texto(texto) == PROSA


def test_resumen_de_actividades_no_es_resumen():
    texto = f"Resumen de actividades y avances presentados\n{PROSA}\nIntroducción"
    assert detectar_resumen_en_texto(texto) is None


def test_indice_no_se_interpreta_como_resumen():
    texto = (
        "ÍNDICE\nRESUMEN\nIntroducción .......... 3\nMetodología .......... 9\n"
        f"RESUMEN\n{PROSA}\nPalabras clave: tesis"
    )
    assert detectar_resumen_en_texto(texto) == PROSA


def test_no_se_corta_una_frase_por_objetivos():
    texto = (
        "RESUMEN\nObjetivos y logros de la investigación tienen una relación con los trabajos realizados. "
        "Los resultados demuestran que puede extraerse el contenido esperado sin interrupciones arbitrarias.\n"
        "Palabras clave: pruebas"
    )
    assert "Objetivos y logros" in (detectar_resumen_en_texto(texto) or "")


def test_no_devuelve_resumen_truncado():
    texto = "RESUMEN\n" + (PROSA + "\n") * 100
    assert detectar_resumen_en_texto(texto) is None
