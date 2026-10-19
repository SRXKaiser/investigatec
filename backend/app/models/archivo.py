
from datetime import datetime

from sqlalchemy import (
    String,
    Text,
    Integer,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.db.base import Base


class Archivo(Base):
    __tablename__ = "archivos"

    __table_args__ = (
        UniqueConstraint(
            "id_documento",
            "version",
            name="uq_archivo_documento_version",
        ),
    )

    id_archivo: Mapped[int] = mapped_column(
        primary_key=True
    )

    id_proyecto: Mapped[int] = mapped_column(
        ForeignKey("proyectos.id_proyecto"),
        nullable=False,
        index=True,
    )

    id_documento: Mapped[int] = mapped_column(
        ForeignKey("documentos.id_documento"),
        nullable=False,
        index=True,
    )

    nombre_original: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    ruta_almacenamiento: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    tipo_mime: Mapped[str] = mapped_column(
        String(150)
    )

    version: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )

    resumen_detectado: Mapped[str | None] = mapped_column(
        Text
    )

    fecha_subida: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    proyecto: Mapped["Proyecto"] = relationship(
        "Proyecto",
        back_populates="archivos",
    )

    documento: Mapped["Documento"] = relationship(
        "Documento",
        back_populates="versiones",
    )
