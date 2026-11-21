"""Crea un usuario administrador inicial para InvestigaTec 2.0.

Ejecutar desde la carpeta backend:
    python -m app.db.seeds.admin

Requiere las migraciones Alembic aplicadas y la configuración de la BD.
No almacena contraseñas en texto plano.
"""

from getpass import getpass
from sys import exit

from pydantic import EmailStr, TypeAdapter, ValidationError
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError

import app.models  # Registra todas las relaciones de SQLAlchemy
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.db.seeds.roles import crear_roles
from app.models.perfil import Perfil
from app.models.rol import Rol, UsuarioRol
from app.models.usuario import Usuario


def pedir_campo(etiqueta: str, maximo: int, opcional: bool = False) -> str | None:
    while True:
        valor = input(f"{etiqueta}: ").strip()
        if not valor and opcional:
            return None
        if 1 <= len(valor) <= maximo:
            return valor
        print(f"Introduce entre 1 y {maximo} caracteres.")


def main() -> int:
    print("\\n=== Crear administrador inicial de InvestigaTec ===")
    print("Se creará una cuenta nueva con roles MIEMBRO y ADMIN.\\n")

    nombre = pedir_campo("Nombre", 100)
    paterno = pedir_campo("Apellido paterno", 100)
    materno = pedir_campo("Apellido materno (opcional)", 100, opcional=True)

    while True:
        correo_ingresado = input("Correo electrónico: ").strip().lower()
        try:
            correo = str(TypeAdapter(EmailStr).validate_python(correo_ingresado))
            break
        except ValidationError:
            print("Introduce un correo electrónico válido.")

    try:
        with SessionLocal() as db:
            existente = db.scalar(
                select(Usuario).where(func.lower(Usuario.correo) == correo)
            )
            if existente:
                print("Ese correo ya está registrado. No se modificó la cuenta existente.")
                return 1
    except SQLAlchemyError:
        print("No se pudo consultar la base de datos. Revisa DATABASE_URL y PostgreSQL.")
        return 1

    while True:
        clave = getpass("Contraseña (12 a 128 caracteres): ")
        if not 12 <= len(clave) <= 128:
            print("La contraseña debe tener entre 12 y 128 caracteres.")
            continue
        if clave != getpass("Confirmar contraseña: "):
            print("Las contraseñas no coinciden. Inténtalo nuevamente.")
            continue
        break

    confirmar = input("Escribe CREAR para guardar el administrador: ").strip()
    if confirmar != "CREAR":
        print("Operación cancelada; no se creó ningún usuario.")
        return 1

    try:
        # Crea los roles iniciales solo si todavía no existen.
        crear_roles()

        with SessionLocal() as db:
            # Comprobar otra vez antes de escribir, por si cambió la BD.
            existente = db.scalar(
                select(Usuario).where(func.lower(Usuario.correo) == correo)
            )
            if existente:
                print("Ese correo ya está registrado. No se creó otra cuenta.")
                return 1

            roles = {
                rol.nombre: rol
                for rol in db.scalars(
                    select(Rol).where(Rol.nombre.in_(["MIEMBRO", "ADMIN"]))
                )
            }
            if "MIEMBRO" not in roles or "ADMIN" not in roles:
                print("Faltan roles obligatorios. No se creó el usuario.")
                return 1

            usuario = Usuario(
                nombre=nombre,
                apellido_paterno=paterno,
                apellido_materno=materno,
                correo=correo,
                password_hash=hash_password(clave),
                activo=True,
            )
            db.add(usuario)
            db.flush()  # Obtiene id_usuario sin confirmar todavía.

            db.add(
                Perfil(
                    id_usuario=usuario.id_usuario,
                    username=f"investigador{usuario.id_usuario}",
                    nombre_publico=f"{nombre} {paterno}",
                    perfil_visible=False,
                )
            )
            db.add_all(
                [
                    UsuarioRol(id_usuario=usuario.id_usuario, id_rol=roles["MIEMBRO"].id_rol),
                    UsuarioRol(id_usuario=usuario.id_usuario, id_rol=roles["ADMIN"].id_rol),
                ]
            )
            db.commit()

            print(f"\\nAdministrador creado correctamente (ID: {usuario.id_usuario}).")
            print(f"Correo: {correo}")
            print("Roles: MIEMBRO, ADMIN")
            print("Perfil creado como privado. Ya puedes iniciar sesión.")
            return 0

    except SQLAlchemyError:
        print("No se pudo guardar el administrador. Verifica las migraciones y la conexión.")
        return 1


if __name__ == "__main__":
    try:
        exit(main())
    except (KeyboardInterrupt, EOFError):
        print("\\nOperación cancelada.")
        exit(1)
