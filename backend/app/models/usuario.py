from datetime import datetime

from sqlalchemy import String, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id_usuario: Mapped[int] = mapped_column(primary_key=True)

    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    apellido_paterno: Mapped[str] = mapped_column(String(100), nullable=False)
    apellido_materno: Mapped[str | None] = mapped_column(String(100))

    correo: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )

    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    activo: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )

    fecha_registro: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    ultimo_acceso: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True)
    )

    perfil: Mapped["Perfil | None"] = relationship(
        "Perfil", back_populates="usuario", uselist=False
    )

    roles: Mapped[list["UsuarioRol"]] = relationship(
        "UsuarioRol",
        back_populates="usuario",
        foreign_keys="UsuarioRol.id_usuario"
    )
    sesiones: Mapped[list["Sesion"]] = relationship(
        "Sesion",
        back_populates="usuario"
    )

    recuperaciones: Mapped[list["RecuperacionPassword"]] = relationship(
        "RecuperacionPassword",
        back_populates="usuario"
    )

    auditorias: Mapped[list["Auditoria"]] = relationship(
        "Auditoria",
        back_populates="usuario"
    )