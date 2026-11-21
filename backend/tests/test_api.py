import io

from docx import Document
from sqlalchemy import select

from app.models.rol import Rol, UsuarioRol


def test_raiz(client):
    assert client.get("/").status_code == 200


def test_openapi_disponible(client):
    assert client.get("/openapi.json").status_code == 200


def test_ruta_protegida_exige_token(client):
    assert client.get("/auth/me").status_code == 401


def test_registro_valida_password(client):
    r = client.post("/auth/register", json={
        "nombre": "Ana", "apellido_paterno": "López",
        "correo": "ana@example.org", "password": "corta",
    })
    assert r.status_code == 422


def test_registro_y_correo_duplicado(client, usuario):
    r = client.post("/auth/register", json=usuario["datos"])
    assert r.status_code == 409


def test_login_incorrecto(client, usuario):
    r = client.post("/auth/login", json={
        "correo": usuario["datos"]["correo"], "password": "incorrecta",
    })
    assert r.status_code == 401


def test_datos_sesion(client, usuario):
    r = client.get("/auth/me", headers=usuario["headers"])
    assert r.status_code == 200
    assert r.json()["id_usuario"] == usuario["id"]


def test_crud_proyecto(client, usuario):
    headers = usuario["headers"]
    creado = client.post("/proyectos/", json={
        "titulo": "Proyecto de prueba", "descripcion": "Inicial",
    }, headers=headers)
    assert creado.status_code == 201, creado.text
    id_proyecto = creado.json()["id_proyecto"]
    listado = client.get("/proyectos/", headers=headers)
    assert listado.status_code == 200
    assert any(x["id_proyecto"] == id_proyecto for x in listado.json())
    editar = client.patch(f"/proyectos/{id_proyecto}", json={
        "titulo": "Proyecto actualizado",
    }, headers=headers)
    assert editar.status_code == 200
    assert editar.json()["titulo"] == "Proyecto actualizado"
    eliminar = client.delete(f"/proyectos/{id_proyecto}", headers=headers)
    assert eliminar.status_code == 204
    assert client.get(f"/proyectos/{id_proyecto}", headers=headers).status_code == 404


def test_busqueda_paginada(client, usuario):
    for titulo in ("Proyecto primero", "Proyecto segundo"):
        assert client.post("/proyectos/", json={"titulo": titulo}, headers=usuario["headers"]).status_code == 201
    r = client.get("/proyectos/buscar", params={"pagina": 1, "limite": 1}, headers=usuario["headers"])
    assert r.status_code == 200
    assert r.json()["total"] == 2
    assert len(r.json()["resultados"]) == 1


def test_usuario_normal_no_es_admin(client, usuario):
    assert client.get("/admin/usuarios", headers=usuario["headers"]).status_code == 403


def test_admin_puede_listar_usuarios(client, usuario, session_factory):
    with session_factory() as db:
        rol = db.scalar(select(Rol).where(Rol.nombre == "ADMIN"))
        db.add(UsuarioRol(id_usuario=usuario["id"], id_rol=rol.id_rol))
        db.commit()
    r = client.get("/admin/usuarios", headers=usuario["headers"])
    assert r.status_code == 200
    assert r.json()[0]["correo"] == "ana@example.org"


def test_sin_acceso_a_otro_proyecto(client, usuario):
    creado = client.post("/proyectos/", json={"titulo": "Privado de Ana"}, headers=usuario["headers"])
    assert creado.status_code == 201
    id_proyecto = creado.json()["id_proyecto"]
    otro = {"nombre": "Beto", "apellido_paterno": "Prueba", "correo": "beto@example.org", "password": "PasswordSeguro123!"}
    assert client.post("/auth/register", json=otro).status_code == 201
    acceso = client.post("/auth/login", json={"correo": otro["correo"], "password": otro["password"]})
    otro_headers = {"Authorization": f"Bearer {acceso.json()['access_token']}"}
    assert client.get(f"/proyectos/{id_proyecto}", headers=otro_headers).status_code == 404
    assert client.patch(f"/proyectos/{id_proyecto}", headers=otro_headers, json={"titulo": "No autorizado"}).status_code == 403


def test_subida_docx_y_reprocesamiento(client, usuario, tmp_path, monkeypatch):
    from app.services import archivos as servicio
    monkeypatch.setattr(servicio, "CARPETA_STORAGE", tmp_path)
    creado = client.post("/proyectos/", json={"titulo": "Proyecto con documento"}, headers=usuario["headers"])
    assert creado.status_code == 201
    documento = Document()
    documento.add_heading("RESUMEN", level=1)
    documento.add_paragraph("Este trabajo propone una plataforma de investigación que centraliza la información académica y permite consultar los datos principales. La evaluación evidencia que registrar proyectos desde un único lugar mejora la organización y facilita las revisiones posteriores.")
    documento.add_heading("Palabras clave", level=2)
    memoria = io.BytesIO()
    documento.save(memoria)
    r = client.post(f"/archivos/proyectos/{creado.json()['id_proyecto']}", headers=usuario["headers"], files={"archivo": ("tesis.docx", memoria.getvalue(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")})
    assert r.status_code == 201, r.text
    archivo = r.json()
    assert "centraliza" in (archivo["resumen_detectado"] or "")
    reprocesar = client.post(f"/archivos/{archivo['id_archivo']}/reprocesar-resumen", headers=usuario["headers"])
    assert reprocesar.status_code == 200, reprocesar.text
    assert reprocesar.json()["resumen_detectado"] == archivo["resumen_detectado"]
    descarga = client.get(f"/archivos/{archivo['id_archivo']}/descargar", headers=usuario["headers"])
    assert descarga.status_code == 200
    assert descarga.content.startswith(b"PK")


def test_doi_valida_entrada(client):
    assert client.get("/publicaciones/doi", params={"doi": "NO-ES-DOI"}).status_code == 422


def test_doi_fuente_externa_mock(client, monkeypatch):
    from app.api import publicaciones
    import httpx

    class FakeClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return None

        async def get(self, url, **kwargs):
            return httpx.Response(200, json={"message": {
                "DOI": "10.1038/nphys1170",
                "title": ["Artículo académico de prueba"],
                "container-title": ["Revista de prueba"],
                "published": {"date-parts": [[2023, 1, 1]]},
                "author": [{"given": "María", "family": "García"}],
            }}, request=httpx.Request("GET", url))

    monkeypatch.setattr(publicaciones.httpx, "AsyncClient", lambda **kwargs: FakeClient())
    r = client.get("/publicaciones/doi", params={"doi": "10.1038/nphys1170"})
    assert r.status_code == 200, r.text
    assert r.json()["anio"] == 2023
    assert r.json()["autores"] == ["María García"]


def test_crud_enlaces_academicos(client, usuario):
    headers = usuario["headers"]
    creado = client.post("/academico/enlaces", headers=headers, json={
        "tipo": "Repositorio", "url": "https://ejemplo.org/investigacion", "orden": 0,
    })
    assert creado.status_code == 201, creado.text
    id_enlace = creado.json()["id_enlace"]
    consulta = client.get("/academico/enlaces", headers=headers)
    assert consulta.status_code == 200
    assert len(consulta.json()) == 1
    actualizado = client.patch(f"/academico/enlaces/{id_enlace}", headers=headers, json={
        "tipo": "Artículo", "url": "https://ejemplo.org/articulo",
    })
    assert actualizado.status_code == 200
    assert actualizado.json()["tipo"] == "Artículo"
    invalidado = client.patch(f"/academico/enlaces/{id_enlace}", headers=headers, json={"tipo": " "})
    assert invalidado.status_code == 422
    eliminado = client.delete(f"/academico/enlaces/{id_enlace}", headers=headers)
    assert eliminado.status_code == 204
    assert client.get("/academico/enlaces", headers=headers).json() == []


def test_enlace_ajeno_no_puede_modificarse(client, usuario):
    resp = client.post("/academico/enlaces", headers=usuario["headers"], json={
        "tipo": "ORCID", "url": "https://orcid.org/0000-0000-0000-0000",
    })
    assert resp.status_code == 201
    otro = {"nombre": "Beto", "apellido_paterno": "Prueba", "correo": "beto@example.org", "password": "PasswordSeguro123!"}
    assert client.post("/auth/register", json=otro).status_code == 201
    login = client.post("/auth/login", json={"correo": otro["correo"], "password": otro["password"]})
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    id_enlace = resp.json()["id_enlace"]
    assert client.patch(f"/academico/enlaces/{id_enlace}", headers=headers, json={"tipo": "Hack"}).status_code == 404
    assert client.delete(f"/academico/enlaces/{id_enlace}", headers=headers).status_code == 404


def test_flujo_revision_con_correcciones(client, usuario, session_factory, tmp_path, monkeypatch):
    from app.services import archivos as servicio
    monkeypatch.setattr(servicio, "CARPETA_STORAGE", tmp_path)
    from app.models.usuario import Usuario

    def crear_cuenta(nombre, correo, rol):
        r = client.post("/auth/register", json={
            "nombre": nombre, "apellido_paterno": "Prueba",
            "correo": correo, "password": "PasswordSeguro123!",
        })
        assert r.status_code == 201, r.text
        with session_factory() as db:
            rol_db = db.scalar(select(Rol).where(Rol.nombre == rol))
            db.add(UsuarioRol(id_usuario=r.json()["id_usuario"], id_rol=rol_db.id_rol))
            db.commit()
        login = client.post("/auth/login", json={"correo": correo, "password": "PasswordSeguro123!"})
        return r.json()["id_usuario"], {"Authorization": f"Bearer {login.json()['access_token']}"}

    id_admin, admin_headers = crear_cuenta("Administrador", "admin@example.org", "ADMIN")
    id_revisor, revisor_headers = crear_cuenta("Revisor", "revisor@example.org", "REVISOR")
    asignado = client.put(
        f"/asignaciones/investigadores/{usuario['id']}/revisor",
        json={"id_revisor": id_revisor},
        headers=admin_headers,
    )
    assert asignado.status_code == 200, asignado.text

    creado = client.post("/proyectos/", json={"titulo": "Tesis para evaluar"}, headers=usuario["headers"])
    assert creado.status_code == 201
    id_proyecto = creado.json()["id_proyecto"]
    documento = Document()
    documento.add_heading("RESUMEN")
    documento.add_paragraph("Este documento académico se utiliza para probar el ciclo de una revisión con correcciones. La segunda versión contiene cambios para permitir la aprobación final y mantener trazabilidad de los documentos.")
    documento.add_heading("Palabras clave")
    memoria = io.BytesIO()
    documento.save(memoria)
    archivos = {"archivo": ("tesis.docx", memoria.getvalue(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    carga = client.post(f"/archivos/proyectos/{id_proyecto}", headers=usuario["headers"], files=archivos)
    assert carga.status_code == 201, carga.text
    id_archivo = carga.json()["id_archivo"]
    enviada = client.post(f"/revisiones/enviar/{id_archivo}", headers=usuario["headers"])
    assert enviada.status_code == 201, enviada.text
    id_revision = enviada.json()["id_revision"]
    pendientes = client.get("/revisiones/pendientes", headers=revisor_headers)
    assert pendientes.status_code == 200 and len(pendientes.json()) == 1

    # No se admite subir una versión nueva mientras el revisor no decida.
    bloqueada = client.post(f"/archivos/{id_archivo}/versiones", headers=usuario["headers"], files=archivos)
    assert bloqueada.status_code == 409
    sin_comentario = client.post(f"/revisiones/{id_revision}/decision", headers=revisor_headers, json={"resultado": "CORRECCIONES"})
    assert sin_comentario.status_code == 422
    correcciones = client.post(f"/revisiones/{id_revision}/decision", headers=revisor_headers, json={
        "resultado": "CORRECCIONES", "comentario": "Agregar bibliografía",
    })
    assert correcciones.status_code == 201, correcciones.text

    nueva = client.post(f"/archivos/{id_archivo}/versiones", headers=usuario["headers"], files=archivos)
    assert nueva.status_code == 201, nueva.text
    assert nueva.json()["version"] == 2
    enviada2 = client.post(f"/revisiones/enviar/{nueva.json()['id_archivo']}", headers=usuario["headers"])
    assert enviada2.status_code == 201
    aprobada = client.post(f"/revisiones/{enviada2.json()['id_revision']}/decision", headers=revisor_headers, json={
        "resultado": "APROBADO",
    })
    assert aprobada.status_code == 201, aprobada.text
    seguimiento = client.get(f"/seguimiento/proyectos/{id_proyecto}", headers=usuario["headers"])
    assert seguimiento.status_code == 200, seguimiento.text
    assert seguimiento.json()["documentos"][0]["estado"] == "APROBADO"
    assert len(seguimiento.json()["documentos"][0]["versiones"]) == 2


def test_health_falla_si_bd_no_responde(client, monkeypatch):
    from app import main
    from sqlalchemy.exc import SQLAlchemyError

    class ErrorEngine:
        def connect(self):
            raise SQLAlchemyError("sin conexión")

    monkeypatch.setattr(main, "engine", ErrorEngine())
    respuesta = client.get("/health")
    assert respuesta.status_code == 503


def test_fichero_invalido_rechazado(client, usuario, tmp_path, monkeypatch):
    from app.services import archivos as servicio
    monkeypatch.setattr(servicio, "CARPETA_STORAGE", tmp_path)
    proyecto = client.post("/proyectos/", headers=usuario["headers"], json={
        "titulo": "Proyecto con archivo no válido",
    })
    assert proyecto.status_code == 201
    respuesta = client.post(
        f"/archivos/proyectos/{proyecto.json()['id_proyecto']}",
        files={"archivo": ("falso.pdf", b"contenido que no es pdf", "application/pdf")},
        headers=usuario["headers"],
    )
    assert respuesta.status_code == 422
