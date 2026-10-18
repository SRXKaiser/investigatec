
from datetime import datetime

from sqlalchemy import (
    String, Text, DateTime, ForeignKey, func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Decision(Base):
    __tablename__ = "decisiones"

    id_decision: Mapped[int] = mapped_column(primary_key=True)

    id_revision: Mapped[int] = mapped_column(
        ForeignKey("revisiones.id_revision"),
        nullable=False,
    )

    resultado: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    comentario: Mapped[str | None] = mapped_column(Text)

    fecha_decision: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    revision: Mapped["Revision"] = relationship("Revision")
