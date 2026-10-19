
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AsignacionRevisor(Base):
    __tablename__ = "asignaciones_revisores"

    id_investigador: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id_usuario"),
        primary_key=True,
    )

    id_revisor: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id_usuario"),
        nullable=False,
        index=True,
    )

    asignado_por: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id_usuario"),
        nullable=False,
    )

    fecha_asignacion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    investigador = relationship(
        "Usuario", foreign_keys=[id_investigador]
    )

    revisor = relationship(
        "Usuario", foreign_keys=[id_revisor]
    )

    administrador = relationship(
        "Usuario", foreign_keys=[asignado_por]
    )
