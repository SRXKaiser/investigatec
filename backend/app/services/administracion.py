from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.usuario import Usuario
from app.models.rol import Rol, UsuarioRol
from app.models.auditoria import Auditoria


def buscar_usuario(db: Session, id_usuario: int) -> Usuario:
    usuario = db.get(Usuario, id_usuario)

    if usuario is None:
        raise HTTPException(404, "Usuario no encontrado")

    return usuario


def registrar_auditoria(
    db: Session,
    actor_id: int,
    accion: str,
    entidad: str,
    registro_id: int,
):
    db.add(
        Auditoria(
            id_usuario=actor_id,
            accion=accion,
            entidad=entidad,
            id_registro=registro_id,
        )
    )


def roles_de_usuario(db: Session, id_usuario: int) -> list[Rol]:
    return list(
        db.scalars(
            select(Rol)
            .join(UsuarioRol, Rol.id_rol == UsuarioRol.id_rol)
            .where(UsuarioRol.id_usuario == id_usuario)
            .order_by(Rol.nombre)
        ).all()
    )


def asignar_rol(
    db: Session,
    id_usuario: int,
    id_rol: int,
    actor_id: int,
):
    buscar_usuario(db, id_usuario)

    rol = db.get(Rol, id_rol)

    if rol is None:
        raise HTTPException(404, "Rol no encontrado")

    relacion = db.get(UsuarioRol, (id_usuario, id_rol))

    if relacion is not None:
        raise HTTPException(409, "El usuario ya tiene este rol")

    try:
        db.add(
            UsuarioRol(
                id_usuario=id_usuario,
                id_rol=id_rol,
                asignado_por=actor_id,
            )
        )

        registrar_auditoria(
            db, actor_id,
            f"ASIGNAR_ROL_{rol.nombre}",
            "usuarios_roles",
            id_usuario,
        )

        db.commit()

    except Exception:
        db.rollback()
        raise


def revocar_rol(
    db: Session,
    id_usuario: int,
    id_rol: int,
    actor_id: int,
):
    buscar_usuario(db, id_usuario)

    rol = db.get(Rol, id_rol)

    if rol is None:
        raise HTTPException(404, "Rol no encontrado")

    if rol.nombre == "MIEMBRO":
        raise HTTPException(
            400, "No se puede revocar el rol base MIEMBRO"
        )

    relacion = db.get(UsuarioRol, (id_usuario, id_rol))

    if relacion is None:
        raise HTTPException(404, "El usuario no tiene ese rol")

    if rol.nombre == "ADMIN":
        if id_usuario == actor_id:
            raise HTTPException(
                400, "No puedes revocar tu propio rol ADMIN"
            )

        administradores = list(
            db.scalars(
                select(UsuarioRol)
                .join(Usuario, Usuario.id_usuario == UsuarioRol.id_usuario)
                .where(
                    UsuarioRol.id_rol == id_rol,
                    Usuario.activo.is_(True),
                )
                .with_for_update(of=UsuarioRol)
            ).all()
        )

        if len(administradores) <= 1:
            raise HTTPException(
                400, "Debe permanecer un administrador activo"
            )

    try:
        db.delete(relacion)

        registrar_auditoria(
            db, actor_id,
            f"REVOCAR_ROL_{rol.nombre}",
            "usuarios_roles",
            id_usuario,
        )

        db.commit()

    except Exception:
        db.rollback()
        raise


def cambiar_estado_usuario(
    db: Session,
    id_usuario: int,
    activo: bool,
    actor_id: int,
):
    usuario = buscar_usuario(db, id_usuario)

    if id_usuario == actor_id and not activo:
        raise HTTPException(
            400, "No puedes desactivar tu propia cuenta"
        )

    if not activo:
        rol_admin = db.scalar(
            select(Rol).where(Rol.nombre == "ADMIN")
        )

        if rol_admin:
            administradores = list(
                db.scalars(
                    select(Usuario)
                    .join(
                        UsuarioRol,
                        UsuarioRol.id_usuario == Usuario.id_usuario,
                    )
                    .where(
                        UsuarioRol.id_rol == rol_admin.id_rol,
                        Usuario.activo.is_(True),
                    )
                    .with_for_update(of=Usuario)
                ).all()
            )

            if (
                usuario in administradores
                and len(administradores) <= 1
            ):
                raise HTTPException(
                    400, "Debe permanecer un administrador activo"
                )

    if usuario.activo == activo:
        return usuario

    try:
        usuario.activo = activo

        registrar_auditoria(
            db, actor_id,
            "ACTIVAR_USUARIO" if activo else "DESACTIVAR_USUARIO",
            "usuarios",
            id_usuario,
        )

        db.commit()
        db.refresh(usuario)

    except Exception:
        db.rollback()
        raise

    return usuario