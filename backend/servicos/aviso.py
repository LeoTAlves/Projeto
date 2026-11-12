import re
import unicodedata
from datetime import datetime, timezone
from hmac import compare_digest
from secrets import token_hex

from modelos.ocorrencia import Ocorrencia
from repositorios import aviso as repositorio_aviso
from repositorios.usuario import buscar_usuario_por_id


PALAVRAS_COMUNS = {"com", "uma", "uns", "umas", "para", "pelo", "pela", "meu", "minha", "objeto", "perdido", "perdida", "achado", "encontrado"}


def mudar_situacao(aviso, situacao):
    aviso.situacao = situacao
    aviso.situacao_desde = datetime.now(timezone.utc)


def registrar_evento(sessao, aviso, tipo, descricao, usuario):
    agora = datetime.now(timezone.utc)
    sessao.add(Ocorrencia(
        aviso_id=aviso.id, tipo=tipo, descricao=descricao[:200], data=agora.date(),
        atendente=f"#{usuario.id} {usuario.nome}"[:100], registrada_em=agora,
    ))


def mesma_categoria(achado, perda):
    return achado.categoria not in (None, "Outros") and achado.categoria == perda.categoria


def termos_da_descricao(descricao):
    texto = unicodedata.normalize("NFKD", descricao.casefold())
    texto = "".join(letra for letra in texto if not unicodedata.combining(letra))
    return {termo for termo in re.findall(r"[a-z0-9]{2,}", texto) if termo not in PALAVRAS_COMUNS}


# Ordena por termos compartilhados e usa o local e a data apenas para desempatar.
def triar_objeto(sessao, achado, busca=None):
    termos = termos_da_descricao(busca or achado.descricao)
    candidatos = []
    for perda in repositorio_aviso.percorrer_perdas_abertas(sessao):
        em_comum = sorted(termos & termos_da_descricao(perda.descricao))
        if em_comum or (not busca and mesma_categoria(achado, perda)):
            candidatos.append((perda, em_comum))
    candidatos.sort(key=lambda item: (
        not mesma_categoria(achado, item[0]),
        -len(item[1]),
        item[0].pavilhao != achado.pavilhao,
        abs((item[0].noite - achado.noite).days),
        item[0].id,
    ))
    return candidatos


# Valida todo o lote antes de gravar o achado em cada aviso selecionado.
def confirmar_triagem(sessao, achado_id, aviso_ids, usuario):
    ids = set(aviso_ids)
    if achado_id in ids or len(ids) != len(aviso_ids):
        return "Selecione avisos de perda distintos."
    registros = repositorio_aviso.bloquear_avisos(sessao, ids | {achado_id})
    achado = registros.get(achado_id)
    if achado is None:
        return None
    if achado.situacao != "aguardando retirada" or achado.visitante_id is not None:
        return "Este objeto já foi triado ou vinculado. Atualize o balcão."
    perdas = [registros.get(aviso_id) for aviso_id in aviso_ids]
    if any(perda is None or perda.situacao != "procurando" or perda.visitante_id is None for perda in perdas):
        return "Um dos avisos selecionados já mudou. Atualize a busca e tente novamente."

    for perda in perdas:
        mudar_situacao(perda, "aguardando retirada")
        perda.origem_achado_id = achado.id
        perda.local_guarda = achado.local_guarda
        perda.recebido_por = achado.recebido_por
        perda.nonce_retirada = None
        registrar_evento(sessao, perda, "objeto achado",
                         f"Achado confirmado na triagem #{achado.id}: {achado.descricao}", usuario)
    # Fecha o registro de entrada para evitar uma segunda retirada do mesmo lote.
    mudar_situacao(achado, "triado")
    sessao.commit()
    return perdas


# O serviço repassa os filtros; o repositório monta a consulta paginada no banco.
def listar_avisos(sessao, pavilhao=None, visitante_id=None, pagina=1, pendencia=None):
    return repositorio_aviso.listar_avisos(sessao, pavilhao, visitante_id, pagina, pendencia)


def possiveis_duplicados(sessao, descricao, visitante_id):
    termos = termos_da_descricao(descricao)
    if not termos:
        return []
    candidatos = []
    para_ia = []
    for aviso in repositorio_aviso.perdas_do_visitante(sessao, visitante_id):
        if len(para_ia) < 20:
            para_ia.append(aviso)
        outros = termos_da_descricao(aviso.descricao)
        pontuacao = 2 * len(termos & outros) / (len(termos) + len(outros))
        if pontuacao >= 0.65:
            candidatos.append((pontuacao, aviso))
    candidatos.sort(key=lambda item: (-item[0], -item[1].id))
    if candidatos:
        return [aviso for _, aviso in candidatos[:5]]
    # O modelo recebe somente descrições dos avisos abertos da própria conta.
    from ia.sugestao import sugerir_duplicados
    return sugerir_duplicados(descricao, para_ia)


# A rota decide o 404 quando o repositório não encontra o aviso.
def buscar_aviso(sessao, aviso_id, usuario_id):
    return repositorio_aviso.buscar_aviso_por_id(sessao, aviso_id, usuario_id)


# A cartilha vincula a perda a um visitante e define procurando como situação inicial.
def criar_aviso(sessao, dados, usuario):
    if usuario.tipo != "visitante":
        return "O aviso de perda deve pertencer a um visitante."
    dados_do_aviso = {
        **dados,
        "local_guarda": None,
        "situacao": "procurando",
        "situacao_desde": datetime.now(timezone.utc),
        "visitante_id": usuario.id,
    }
    return repositorio_aviso.criar_aviso(sessao, dados_do_aviso)


# O balcão recebe o objeto mesmo quando o dono ainda é desconhecido.
def registrar_objeto_no_balcao(sessao, dados, usuario):
    agora = datetime.now(timezone.utc)
    # Sem data do achado, o sistema usa a data do registro e deixa o pavilhão como desconhecido.
    return repositorio_aviso.criar_aviso(sessao, {
        **dados, "visitante_id": None, "situacao": "aguardando retirada",
        "pavilhao": dados.get("pavilhao") or "Não informado",
        "noite": dados.get("noite") or agora.date(),
        "detalhe_privado": None, "situacao_desde": agora,
        "recebido_por": f"#{usuario.id} {usuario.nome}"[:100],
    })


# O bloqueio impede que o cancelamento e a confirmação do achado disputem o aviso.
def cancelar_aviso(sessao, aviso_id, visitante_id):
    aviso = repositorio_aviso.bloquear_aviso(sessao, aviso_id)
    if aviso is None or aviso.visitante_id != visitante_id:
        return None
    if aviso.situacao == "cancelado":
        return aviso
    if aviso.situacao != "procurando":
        return "Só é possível cancelar um aviso que ainda está em busca."
    mudar_situacao(aviso, "cancelado")
    sessao.commit()
    return aviso


# Após conferir o dono, o balcão vincula o aviso uma única vez.
def vincular_visitante(sessao, aviso_id, visitante_id, usuario):
    aviso = repositorio_aviso.bloquear_aviso(sessao, aviso_id)
    if aviso is None:
        return None
    if aviso.visitante_id is not None or aviso.situacao != "aguardando retirada":
        return "Somente um objeto aguardando retirada e sem visitante pode ser vinculado."
    visitante = buscar_usuario_por_id(sessao, visitante_id)
    if visitante is None or visitante.tipo != "visitante":
        return "Selecione uma conta de visitante."
    aviso.visitante_id = visitante.id
    mudar_situacao(aviso, "aguardando retirada")
    registrar_evento(sessao, aviso, "objeto achado", "Visitante vinculado no balcão.", usuario)
    sessao.commit()
    sessao.refresh(aviso)
    return aviso


def aprovar_retirada(sessao, aviso_id, dados, usuario):
    aviso = repositorio_aviso.bloquear_aviso(sessao, aviso_id)
    if aviso is None:
        return None
    if aviso.situacao != "aguardando retirada" or aviso.visitante_id is None:
        return "Selecione um achado em conferência vinculado a um visitante."
    if aviso.nonce_retirada:
        return aviso
    if not dados.conferido:
        return "Confirme a conferência de propriedade antes de aprovar."
    if aviso.detalhe_privado:
        esperado = " ".join(aviso.detalhe_privado.casefold().split()).encode()
        informado = " ".join((dados.detalhe_informado or "").casefold().split()).encode()
        if not compare_digest(esperado, informado):
            return "O detalhe informado não confere com o registro do visitante."
    aviso.nonce_retirada = token_hex(32)
    mudar_situacao(aviso, "aguardando retirada")
    registrar_evento(sessao, aviso, "retirada aprovada", "Propriedade conferida no balcão.", usuario)
    sessao.commit()
    return aviso


def corrigir_vinculo(sessao, aviso_id, usuario):
    aviso = repositorio_aviso.bloquear_aviso(sessao, aviso_id)
    if aviso is None:
        return None
    if aviso.situacao != "aguardando retirada" or aviso.visitante_id is None:
        return "Somente vínculos com retirada pendente podem ser corrigidos."
    aviso.nonce_retirada = None
    registrar_evento(sessao, aviso, "vinculo corrigido", "Correspondência desfeita pelo balcão.", usuario)
    if aviso.recebido_por and aviso.origem_achado_id is None:
        aviso.visitante_id = None
        mudar_situacao(aviso, "aguardando retirada")
    else:
        if aviso.origem_achado_id:
            origem = repositorio_aviso.buscar_aviso_por_id(sessao, aviso.origem_achado_id)
            if origem is not None:
                sessao.add(type(origem)(
                    descricao=origem.descricao, pavilhao=origem.pavilhao, noite=origem.noite,
                    categoria=origem.categoria, cor=origem.cor, marca=origem.marca,
                    local_guarda=origem.local_guarda, recebido_por=origem.recebido_por,
                    situacao="aguardando retirada", situacao_desde=datetime.now(timezone.utc),
                ))
        aviso.origem_achado_id = None
        aviso.local_guarda = None
        aviso.recebido_por = None
        mudar_situacao(aviso, "procurando")
    sessao.commit()
    return aviso
