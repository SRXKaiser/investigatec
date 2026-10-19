from datetime import datetime

from sqlalchemy import (
    String, Text, Boolean, DateTime,
    ForeignKey, Integer, func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Perfil(Base):
    __tablename__ = "perfiles"

    id_perfil: Mapped[int] = mapped_column(primary_key=True)

    id_usuario: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id_usuario"),
        unique=True,
        nullable=False
    )
    enlaces: Mapped[list["EnlacePerfil"]] = relationship(
        "EnlacePerfil",
        back_populates="perfil",
        cascade="all, delete-orphan"
    )

    areas: Mapped[list["PerfilArea"]] = relationship(
        "PerfilArea",
        back_populates="perfil",
        cascade="all, delete-orphan"
    )

    nombre_publico: Mapped[str | None] = mapped_column(String(150))

    username: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )

    biografia: Mapped[str | None] = mapped_column(Text)

    foto_perfil: Mapped[str | None] = mapped_column(String(500))
    foto_portada: Mapped[str | None] = mapped_column(String(500))

    institucion: Mapped[str | None] = mapped_column(String(150))
    especialidad: Mapped[str | None] = mapped_column(String(150))

    perfil_visible: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    fecha_actualizacion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    usuario: Mapped["Usuario"] = relationship(
        "Usuario", back_populates="perfil"
    )

class EnlacePerfil(Base):
    __tablename__ = "enlaces_perfil"

    id_enlace: Mapped[int] = mapped_column(primary_key=True)

    id_perfil: Mapped[int] = mapped_column(
        ForeignKey("perfiles.id_perfil"),
        nullable=False
    )

    tipo: Mapped[str] = mapped_column(
        String(50), nullable=False
    )

    url: Mapped[str] = mapped_column(
        String(500), nullable=False
    )

    orden: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )

    perfil: Mapped["Perfil"] = relationship(
        "Perfil", back_populates="enlaces"
    )


class AreaInvestigacion(Base):
    __tablename__ = "areas_investigacion"

    id_area: Mapped[int] = mapped_column(primary_key=True)

    nombre: Mapped[str] = mapped_column(
        String(150), unique=True, nullable=False
    )

    perfiles: Mapped[list["PerfilArea"]] = relationship(
        "PerfilArea", back_populates="area"
    )


class PerfilArea(Base):
    __tablename__ = "perfil_areas"

    id_perfil: Mapped[int] = mapped_column(
        ForeignKey("perfiles.id_perfil"),
        primary_key=True
    )

    id_area: Mapped[int] = mapped_column(
        ForeignKey("areas_investigacion.id_area"),
        primary_key=True
    )

    perfil: Mapped["Perfil"] = relationship(
        "Perfil", back_populates="areas"
    )

    area: Mapped["AreaInvestigacion"] = relationship(
        "AreaInvestigacion", back_populates="perfiles"
    )