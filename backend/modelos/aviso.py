from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String
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
    categoria = Column(String(40))
    cor = Column(String(100))
    marca = Column(String(100))
    local_guarda = Column(String(100))
    detalhe_privado = Column(String(200))
    nonce_retirada = Column(String(64))
    origem_achado_id = Column(Integer)
    situacao_desde = Column(DateTime(timezone=True))
    recebido_por = Column(String(100))

    @property
    def retirada_aprovada(self):
        return bool(self.nonce_retirada)

    @property
    def tem_detalhe_privado(self):
        return bool(self.detalhe_privado)
    visitante_id = Column(
        Integer,
        ForeignKey("usuarios.id", name="fk_avisos_visitante"),
        nullable=True,
    )

    # relationship permite ler aviso.ocorrencias; ele não acrescenta uma coluna ao banco.
    ocorrencias = relationship("Ocorrencia")
