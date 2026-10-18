
from datetime import datetime

from sqlalchemy import (
    String, Text, DateTime, ForeignKey, func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Proyecto(Base):
    __tablename__ = "proyectos"

    id_proyecto: Mapped[int] = mapped_column(primary_key=True)

    id_usuario: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id_usuario"),
        nullable=False,
        index=True,
    )

    titulo: Mapped[str] = mapped_column(String(255), nullable=False)

    descripcion: Mapped[str | None] = mapped_column(Text)

    estado: Mapped[str] = mapped_column(
        String(30),
        default="BORRADOR",
        nullable=False,
    )

    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    fecha_actualizacion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    propietario: Mapped["Usuario"] = relationship("Usuario")

    archivos: Mapped[list["Archivo"]] = relationship(
        "Archivo",
        back_populates="proyecto",
    )
