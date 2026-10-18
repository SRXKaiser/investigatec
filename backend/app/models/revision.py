
from datetime import datetime

from sqlalchemy import (
    String, Text, DateTime, ForeignKey, func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Revision(Base):
    __tablename__ = "revisiones"

    id_revision: Mapped[int] = mapped_column(primary_key=True)

    id_archivo: Mapped[int] = mapped_column(
        ForeignKey("archivos.id_archivo"),
        nullable=False,
        index=True,
    )

    id_revisor: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id_usuario"),
        nullable=False,
    )

    estado: Mapped[str] = mapped_column(
        String(30),
        default="PENDIENTE",
        nullable=False,
    )

    observaciones: Mapped[str | None] = mapped_column(Text)

    fecha_asignacion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    fecha_revision: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True)
    )

    archivo: Mapped["Archivo"] = relationship("Archivo")

    revisor: Mapped["Usuario"] = relationship("Usuario")
