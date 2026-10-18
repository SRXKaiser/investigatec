from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.core.permissions import requerir_admin
from app.db.session import get_db
from app.models.usuario import Usuario
from app.models.auditoria import Auditoria

from app.schemas.administracion import (
    AsignarRol,
    RolRespuesta,
    UsuarioAdminRespuesta,
    EstadoUsuario,
    AuditoriaRespuesta,
)

from app.services.administracion import (
    buscar_usuario,
    roles_de_usuario,
    asignar_rol,
    revocar_rol,
    cambiar_estado_usuario,
)


router = APIRouter(
    prefix="/admin",
    tags=["Administración"],
    dependencies=[Depends(requerir_admin)],
)


def respuesta_usuario(db: Session, usuario: Usuario):
    return {
        "id_usuario": usuario.id_usuario,
        "nombre": usuario.nombre,
        "apellido_paterno": usuario.apellido_paterno,
        "correo": usuario.correo,
        "activo": usuario.activo,
        "roles": [
            rol.nombre
            for rol in roles_de_usuario(db, usuario.id_usuario)
        ],
    }


@router.get(
    "/usuarios",
    response_model=list[UsuarioAdminRespuesta],
)
def listar_usuarios(
    limite: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    usuarios = db.scalars(
        select(Usuario)
        .order_by(Usuario.id_usuario)
        .offset(offset)
        .limit(limite)
    ).all()

    return [
        respuesta_usuario(db, usuario)
        for usuario in usuarios
    ]


@router.get(
    "/usuarios/{id_usuario}",
    response_model=UsuarioAdminRespuesta,
)
def consultar_usuario(
    id_usuario: int,
    db: Session = Depends(get_db),
):
    usuario = buscar_usuario(db, id_usuario)
    return respuesta_usuario(db, usuario)


@router.get(
    "/usuarios/{id_usuario}/roles",
    response_model=list[RolRespuesta],
)
def consultar_roles_usuario(
    id_usuario: int,
    db: Session = Depends(get_db),
):
    buscar_usuario(db, id_usuario)
    return roles_de_usuario(db, id_usuario)


@router.post("/usuarios/{id_usuario}/roles")
def asignar_rol_usuario(
    id_usuario: int,
    datos: AsignarRol,
    admin: Usuario = Depends(requerir_admin),
    db: Session = Depends(get_db),
):
    asignar_rol(
        db,
        id_usuario,
        datos.id_rol,
        admin.id_usuario,
    )

    return {"mensaje": "Rol asignado correctamente"}


@router.delete(
    "/usuarios/{id_usuario}/roles/{id_rol}",
    status_code=204,
)
def revocar_rol_usuario(
    id_usuario: int,
    id_rol: int,
    admin: Usuario = Depends(requerir_admin),
    db: Session = Depends(get_db),
):
    revocar_rol(
        db,
        id_usuario,
        id_rol,
        admin.id_usuario,
    )


@router.patch(
    "/usuarios/{id_usuario}/estado",
    response_model=UsuarioAdminRespuesta,
)
def modificar_estado_usuario(
    id_usuario: int,
    datos: EstadoUsuario,
    admin: Usuario = Depends(requerir_admin),
    db: Session = Depends(get_db),
):
    usuario = cambiar_estado_usuario(
        db,
        id_usuario,
        datos.activo,
        admin.id_usuario,
    )

    return respuesta_usuario(db, usuario)


@router.get(
    "/auditoria",
    response_model=list[AuditoriaRespuesta],
)
def consultar_auditoria(
    limite: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    return db.scalars(
        select(Auditoria)
        .order_by(Auditoria.id_auditoria.desc())
        .offset(offset)
        .limit(limite)
    ).all()