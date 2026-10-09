from sqlalchemy import Column, Date, ForeignKey, Integer, String

from banco import Base
from modelos.aviso import Aviso  # Apresenta à Base a tabela para onde a chave aponta.


# ForeignKey impede gravar uma ocorrência para um aviso inexistente.
class Ocorrencia(Base):
    __tablename__ = "ocorrencias"

    id = Column(Integer, primary_key=True)
    aviso_id = Column(Integer, ForeignKey("avisos.id"), nullable=False)
    tipo = Column(String(20), nullable=False)
    descricao = Column(String(200), nullable=False)
    data = Column(Date, nullable=False)
