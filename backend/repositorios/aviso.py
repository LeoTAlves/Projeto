from sqlalchemy import select

from modelos.aviso import Aviso
from modelos.ocorrencia import Ocorrencia  # Registra o destino do relationship antes da consulta.


# A sessão vem da requisição; get devolve o modelo ou None quando o id não existe.
def buscar_aviso_por_id(sessao, aviso_id):
    return sessao.get(Aviso, aviso_id)


# WHERE, ORDER BY, LIMIT e OFFSET são executados no MySQL, antes de trazer as linhas.
def listar_avisos(sessao, pavilhao=None, visitante_id=None, pagina=1):
    consulta = select(Aviso).order_by(Aviso.noite, Aviso.id)
    if pavilhao is not None:
        consulta = consulta.where(Aviso.pavilhao == pavilhao)
    if visitante_id is not None:
        consulta = consulta.where(Aviso.visitante_id == visitante_id)
    consulta = consulta.limit(10).offset((pagina - 1) * 10)
    return sessao.scalars(consulta).all()


# O banco gera o id; refresh traz o registro gravado para compor a resposta 201.
def criar_aviso(sessao, dados):
    aviso = Aviso(**dados)
    sessao.add(aviso)
    sessao.commit()
    sessao.refresh(aviso)
    return aviso
