from sqlalchemy import Column, Date, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from banco import Base
from modelos.usuario import Usuario  # Apresenta à Base a tabela principal dos avisos.


# Os tipos e limites acompanham o esquema; a noite é uma data, como no formulário.
class Aviso(Base):
    __tablename__ = "avisos"

    id = Column(Integer, primary_key=True)
    descricao = Column(String(200), nullable=False)
    pavilhao = Column(String(20), nullable=False)
    noite = Column(Date, nullable=False)
    situacao = Column(String(20), nullable=False)
    visitante_id = Column(
        Integer,
        ForeignKey("usuarios.id", name="fk_avisos_visitante"),
        nullable=False,
    )

    # relationship permite ler aviso.ocorrencias; ele não acrescenta uma coluna ao banco.
    ocorrencias = relationship("Ocorrencia")
