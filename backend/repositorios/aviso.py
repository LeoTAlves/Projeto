from sqlalchemy import select

from modelos.aviso import Aviso
from modelos.ocorrencia import Ocorrencia  # Registra o destino do relationship antes da consulta.


# A sessão vem da requisição; get devolve o modelo ou None quando o id não existe.
def buscar_aviso_por_id(sessao, aviso_id, visitante_id=None):
    if visitante_id is None:
        return sessao.get(Aviso, aviso_id)

    consulta = select(Aviso).where(
        Aviso.id == aviso_id,
        Aviso.visitante_id == visitante_id,
    )
    return sessao.scalar(consulta)


# Serializa o vínculo e a devolução quando dois atendentes abrem o mesmo aviso.
def bloquear_aviso(sessao, aviso_id):
    consulta = select(Aviso).where(Aviso.id == aviso_id).with_for_update()
    return sessao.scalar(consulta)


def bloquear_avisos(sessao, ids):
    consulta = select(Aviso).where(Aviso.id.in_(ids)).order_by(Aviso.id).with_for_update()
    return {aviso.id: aviso for aviso in sessao.scalars(consulta)}


# WHERE, ORDER BY, LIMIT e OFFSET são executados no MySQL, antes de trazer as linhas.
def listar_avisos(sessao, pavilhao=None, visitante_id=None, pagina=1, pendencia=None):
    consulta = select(Aviso).order_by(Aviso.noite, Aviso.id)
    if pavilhao is not None:
        consulta = consulta.where(Aviso.pavilhao == pavilhao)
    if visitante_id is not None:
        consulta = consulta.where(Aviso.visitante_id == visitante_id)
    if pendencia:
        consulta = consulta.where(Aviso.situacao == "aguardando retirada")
        if pendencia == "triagem":
            consulta = consulta.where(Aviso.visitante_id.is_(None))
        else:
            consulta = consulta.where(Aviso.visitante_id.is_not(None))
            consulta = consulta.where(
                Aviso.nonce_retirada.is_not(None) if pendencia == "retirada" else Aviso.nonce_retirada.is_(None)
            )
        consulta = consulta.order_by(None).order_by(Aviso.situacao_desde, Aviso.id)
    consulta = consulta.limit(10).offset((pagina - 1) * 10)
    return sessao.scalars(consulta).all()


# O banco gera o id; refresh traz o registro gravado para compor a resposta 201.
def criar_aviso(sessao, dados):
    aviso = Aviso(**dados)
    sessao.add(aviso)
    sessao.commit()
    sessao.refresh(aviso)
    return aviso


# A triagem percorre os avisos de perda em aberto, além da página exibida no balcão.
def percorrer_perdas_abertas(sessao):
    consulta = select(Aviso).where(
        Aviso.situacao == "procurando", Aviso.visitante_id.is_not(None)
    ).execution_options(yield_per=100)
    return sessao.scalars(consulta)


def listar_avisos_para_sugestao(sessao):
    return list(percorrer_perdas_abertas(sessao))


def perdas_do_visitante(sessao, visitante_id):
    consulta = select(Aviso).where(
        Aviso.visitante_id == visitante_id,
        Aviso.situacao.in_(("procurando", "aguardando retirada")),
    ).order_by(Aviso.id.desc())
    return sessao.scalars(consulta)
