"""adiciona email e senha aos usuarios

Revision ID: 7c8e4a1f2b90
Revises: 3ab25937a92a
Create Date: 2026-10-07

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "7c8e4a1f2b90"
down_revision: Union[str, Sequence[str], None] = "3ab25937a92a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


SENHA_TEMPORARIA = (
    "$argon2id$v=19$m=65536,t=3,p=4$"
    "d27xy2zlL+dygoRYjndwdA$BJVIlyiy4+AzzK/iRw5y8nFwG+KMOc2gwwpBeAPj2SA"
)


def upgrade() -> None:
    op.add_column("usuarios", sa.Column("email", sa.String(length=100), nullable=True))
    op.add_column("usuarios", sa.Column("senha", sa.String(length=100), nullable=True))

    op.execute(
        sa.text(
            "UPDATE usuarios "
            "SET email = CONCAT('usuario', id, '@exemplo.local') "
            "WHERE email IS NULL"
        )
    )
    op.execute(
        sa.text("UPDATE usuarios SET senha = :senha WHERE senha IS NULL").bindparams(
            senha=SENHA_TEMPORARIA
        )
    )

    op.alter_column(
        "usuarios",
        "email",
        existing_type=sa.String(length=100),
        nullable=False,
    )
    op.alter_column(
        "usuarios",
        "senha",
        existing_type=sa.String(length=100),
        nullable=False,
    )
    op.create_unique_constraint("uq_usuarios_email", "usuarios", ["email"])


def downgrade() -> None:
    op.drop_constraint("uq_usuarios_email", "usuarios", type_="unique")
    op.drop_column("usuarios", "senha")
    op.drop_column("usuarios", "email")
