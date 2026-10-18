from datetime import datetime

from sqlalchemy import (
    String, Text, DateTime, ForeignKey, func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Rol(Base):
    __tablename__ = "roles"

    id_rol: Mapped[int] = mapped_column(primary_key=True)

    nombre: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False
    )

    descripcion: Mapped[str | None] = mapped_column(Text)

    usuarios: Mapped[list["UsuarioRol"]] = relationship(
        "UsuarioRol", back_populates="rol"
    )


class UsuarioRol(Base):
    __tablename__ = "usuarios_roles"

    id_usuario: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id_usuario"),
        primary_key=True
    )

    id_rol: Mapped[int] = mapped_column(
        ForeignKey("roles.id_rol"),
        primary_key=True
    )

    asignado_por: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id_usuario")
    )

    fecha_asignacion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    usuario: Mapped["Usuario"] = relationship(
        "Usuario",
        back_populates="roles",
        foreign_keys=[id_usuario]
    )

    rol: Mapped["Rol"] = relationship(
        "Rol", back_populates="usuarios"
    )

    administrador: Mapped["Usuario | None"] = relationship(
        "Usuario",
        foreign_keys=[asignado_por]
    )