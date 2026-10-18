from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Auditoria(Base):
    __tablename__ = "auditoria"

    id_auditoria: Mapped[int] = mapped_column(primary_key=True)

    id_usuario: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id_usuario"),
        nullable=False
    )

    accion: Mapped[str] = mapped_column(
        String(100), nullable=False
    )

    entidad: Mapped[str] = mapped_column(
        String(100), nullable=False
    )

    id_registro: Mapped[int | None] = mapped_column()

    fecha_evento: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    usuario: Mapped["Usuario"] = relationship(
        "Usuario", back_populates="auditorias"
    )