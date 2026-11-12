from sqlalchemy import BigInteger, Boolean, Column, Integer, String

from banco import Base


# O modelo representa os perfis da cartilha, ainda sem autenticação ou senha.
class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True)
    nome = Column(String(100), nullable=False)
    tipo = Column(String(20), nullable=False)
    email = Column(String(100), nullable=False, unique=True)
    senha = Column(String(100), nullable=False)
    email_confirmado = Column(Boolean, nullable=False, default=True)
    totp_nonce = Column(String(64))
    totp_passo = Column(BigInteger)
    falhas_login = Column(Integer, nullable=False, default=0)
    login_bloqueado_ate = Column(BigInteger)
    confirmacao_enviada_em = Column(BigInteger)
