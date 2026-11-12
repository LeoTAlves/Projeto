"""Adiciona dados do objeto, aprovação de retirada e proteção de contas."""
import sqlalchemy as sa
from alembic import op

revision = "b421a63f9d20"
down_revision = "9ab64c2f018e"
branch_labels = None
depends_on = None


def colunas():
    return {
        "avisos": [
            sa.Column(nome, sa.String(tamanho))
            for nome, tamanho in (
                ("categoria", 40), ("cor", 100), ("marca", 100), ("local_guarda", 100),
                ("detalhe_privado", 200), ("nonce_retirada", 64), ("recebido_por", 100),
            )
        ] + [sa.Column("origem_achado_id", sa.Integer()), sa.Column("situacao_desde", sa.DateTime(timezone=True))],
        "ocorrencias": [sa.Column("atendente", sa.String(100)), sa.Column("registrada_em", sa.DateTime(timezone=True))],
        "usuarios": [
            sa.Column("email_confirmado", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("totp_nonce", sa.String(64)), sa.Column("totp_passo", sa.BigInteger()),
            sa.Column("falhas_login", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("login_bloqueado_ate", sa.BigInteger()),
            sa.Column("confirmacao_enviada_em", sa.BigInteger()),
        ],
    }


def upgrade():
    for tabela, campos in colunas().items():
        for campo in campos:
            op.add_column(tabela, campo)


def downgrade():
    for tabela, campos in colunas().items():
        for campo in reversed(campos):
            op.drop_column(tabela, campo.name)
