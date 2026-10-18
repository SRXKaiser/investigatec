from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.rol import Rol


ROLES_INICIALES = {
    "MIEMBRO": "Integrante del Cuerpo Académico",
    "REVISOR": "Revisa, aprueba o rechaza documentos asignados",
    "ADMIN": "Administra usuarios y permisos",
}

def crear_roles():
    with SessionLocal() as db:
        for nombre, descripcion in ROLES_INICIALES.items():
            existente = db.scalar(
                select(Rol).where(Rol.nombre == nombre)
            )

            if existente is None:
                db.add(
                    Rol(
                        nombre=nombre,
                        descripcion=descripcion,
                    )
                )

        db.commit()

    print("Catálogo de roles listo")


if __name__ == "__main__":
    crear_roles()