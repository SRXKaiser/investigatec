
from datetime import datetime

from sqlalchemy import (
    String, Text, Boolean, DateTime, ForeignKey, func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Notificacion(Base):
    __tablename__ = "notificaciones"

    id_notificacion: Mapped[int] = mapped_column(primary_key=True)

    id_usuario: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id_usuario"),
        nullable=False,
        index=True,
    )

    titulo: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    mensaje: Mapped[str] = mapped_column(Text, nullable=False)

    leida: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    usuario: Mapped["Usuario"] = relationship("Usuario")
