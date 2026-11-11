"""Permite receber objetos antes de identificar o visitante."""

import sqlalchemy as sa
from alembic import op

revision = "9ab64c2f018e"
down_revision = "7c8e4a1f2b90"
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column("avisos", "visitante_id", existing_type=sa.Integer(), nullable=True)


def downgrade():
    # O banco recusa a reversão enquanto houver avisos sem visitante.
    op.alter_column("avisos", "visitante_id", existing_type=sa.Integer(), nullable=False)
