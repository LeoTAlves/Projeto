from sqlalchemy import Column, Integer, String

from banco import Base


# O modelo representa os perfis da cartilha, ainda sem autenticação ou senha.
class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True)
    nome = Column(String(100), nullable=False)
    tipo = Column(String(20), nullable=False)
    email = Column(String(100), nullable=False, unique=True)
    senha = Column(String(100), nullable=False)