"""Integrar identidad permanente de documentos.

Revision ID: cf1bac84b532
Revises: c57d6f523c25
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "cf1bac84b532"

down_revision: Union[str, Sequence[str], None] = (
    "c57d6f523c25"
)

branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conexion = op.get_bind()

    # Verificar que no exista una tabla de documentos previa.
    inspector = sa.inspect(conexion)

    if inspector.has_table("documentos"):
        raise RuntimeError(
            "La tabla documentos ya existe. "
            "No se aplicara una migracion duplicada."
        )

    columnas = {
        columna["name"]
        for columna in inspector.get_columns("archivos")
    }

    if "id_documento" in columnas:
        raise RuntimeError(
            "archivos.id_documento ya existe. "
            "Es necesario reconciliar el esquema."
        )

    # Detectar versiones duplicadas que impedirian
    # establecer una identidad documental unica.

    conflictos = conexion.execute(
        sa.text(
            """
            SELECT
                id_proyecto,
                nombre_original,
                version,
                COUNT(*) AS cantidad
            FROM archivos
            GROUP BY
                id_proyecto,
                nombre_original,
                version
            HAVING COUNT(*) > 1
            """
        )
    ).mappings().all()

    if conflictos:
        raise RuntimeError(
            "Se encontraron versiones duplicadas. "
            "La migracion se cancela para proteger "
            "la informacion existente."
        )

    # Crear tabla de documentos.

    op.create_table(
        "documentos",
        sa.Column(
            "id_documento",
            sa.Integer(),
            primary_key=True,
        ),
        sa.Column(
            "id_proyecto",
            sa.Integer(),
            sa.ForeignKey("proyectos.id_proyecto"),
            nullable=False,
        ),
        sa.Column(
            "nombre",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "fecha_creacion",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    op.create_index(
        "ix_documentos_id_proyecto",
        "documentos",
        ["id_proyecto"],
    )

    # Agregar temporalmente la columna como nullable
    # para conservar y migrar los archivos historicos.

    op.add_column(
        "archivos",
        sa.Column(
            "id_documento",
            sa.Integer(),
            nullable=True,
        ),
    )

    # Obtener grupos de versiones historicas.
    # Esta asociacion inicial utiliza nombre_original,
    # pero las versiones futuras utilizaran id_documento.

    grupos = conexion.execute(
        sa.text(
            """
            SELECT
                id_proyecto,
                nombre_original,
                MIN(fecha_subida) AS fecha_creacion
            FROM archivos
            GROUP BY
                id_proyecto,
                nombre_original
            ORDER BY
                id_proyecto,
                nombre_original
            """
        )
    ).mappings().all()

    for grupo in grupos:

        id_documento = conexion.execute(
            sa.text(
                """
                INSERT INTO documentos (
                    id_proyecto,
                    nombre,
                    fecha_creacion
                )
                VALUES (
                    :id_proyecto,
                    :nombre,
                    :fecha_creacion
                )
                RETURNING id_documento
                """
            ),
            {
                "id_proyecto": grupo["id_proyecto"],
                "nombre": grupo["nombre_original"],
                "fecha_creacion": grupo["fecha_creacion"],
            },
        ).scalar_one()

        conexion.execute(
            sa.text(
                """
                UPDATE archivos
                SET id_documento = :id_documento
                WHERE id_proyecto = :id_proyecto
                  AND nombre_original = :nombre_original
                """
            ),
            {
                "id_documento": id_documento,
                "id_proyecto": grupo["id_proyecto"],
                "nombre_original": grupo["nombre_original"],
            },
        )

    # Verificar que todos los archivos hayan sido asociados.

    pendientes = conexion.execute(
        sa.text(
            """
            SELECT COUNT(*)
            FROM archivos
            WHERE id_documento IS NULL
            """
        )
    ).scalar_one()

    if pendientes != 0:
        raise RuntimeError(
            f"Existen {pendientes} archivos sin documento. "
            "Se cancela la migracion."
        )

    # Hacer obligatoria la identidad documental.

    op.alter_column(
        "archivos",
        "id_documento",
        existing_type=sa.Integer(),
        nullable=False,
    )

    op.create_foreign_key(
        "fk_archivos_id_documento_documentos",
        "archivos",
        "documentos",
        ["id_documento"],
        ["id_documento"],
    )

    op.create_index(
        "ix_archivos_id_documento",
        "archivos",
        ["id_documento"],
    )

    op.create_unique_constraint(
        "uq_archivo_documento_version",
        "archivos",
        ["id_documento", "version"],
    )


def downgrade() -> None:
    # Evitar una perdida accidental de asociaciones
    # entre documentos y versiones.

    raise RuntimeError(
        "Downgrade automatico deshabilitado. "
        "La eliminacion de identidades documentales "
        "requiere un procedimiento de conservacion "
        "de datos."
    )