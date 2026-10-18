
from datetime import datetime

from sqlalchemy import (
    String, DateTime, ForeignKey, func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class HistorialEstado(Base):
    __tablename__ = "historial_estados"

    id_historial: Mapped[int] = mapped_column(primary_key=True)

    id_proyecto: Mapped[int] = mapped_column(
        ForeignKey("proyectos.id_proyecto"),
        nullable=False,
    )

    estado_anterior: Mapped[str | None] = mapped_column(String(30))

    estado_nuevo: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    id_usuario: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id_usuario"),
        nullable=False,
    )

    fecha_cambio: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    proyecto: Mapped["Proyecto"] = relationship("Proyecto")
    usuario: Mapped["Usuario"] = relationship("Usuario")
