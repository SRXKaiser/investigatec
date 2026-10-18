from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class RecuperacionPassword(Base):
    __tablename__ = "recuperacion_password"

    id_recuperacion: Mapped[int] = mapped_column(primary_key=True)

    id_usuario: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id_usuario"),
        nullable=False
    )

    token_hash: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False
    )

    fecha_expiracion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    fecha_uso: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True)
    )

    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    usuario: Mapped["Usuario"] = relationship(
        "Usuario", back_populates="recuperaciones"
    )


class Sesion(Base):
    __tablename__ = "sesiones"

    id_sesion: Mapped[int] = mapped_column(primary_key=True)

    id_usuario: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id_usuario"),
        nullable=False
    )

    token_hash: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False
    )

    fecha_expiracion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    fecha_revocacion: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True)
    )

    usuario: Mapped["Usuario"] = relationship(
        "Usuario", back_populates="sesiones"
    )