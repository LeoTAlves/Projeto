import re
import unicodedata
from datetime import date

from modelos.ocorrencia import Ocorrencia
from repositorios import aviso as repositorio_aviso
from repositorios.usuario import buscar_usuario_por_id


PALAVRAS_COMUNS = {"com", "uma", "uns", "umas", "para", "pelo", "pela", "meu", "minha", "objeto", "perdido", "perdida", "achado", "encontrado"}


def termos_da_descricao(descricao):
    texto = unicodedata.normalize("NFKD", descricao.casefold())
    texto = "".join(letra for letra in texto if not unicodedata.combining(letra))
    return {termo for termo in re.findall(r"[a-z0-9]{2,}", texto) if termo not in PALAVRAS_COMUNS}


# Ordena por termos compartilhados e usa o local e a data apenas para desempatar.
def triar_objeto(sessao, achado, busca=None):
    termos = termos_da_descricao(busca or achado.descricao)
    if not termos:
        return []
    candidatos = []
    for perda in repositorio_aviso.percorrer_perdas_abertas(sessao):
        em_comum = sorted(termos & termos_da_descricao(perda.descricao))
        if em_comum:
            candidatos.append((perda, em_comum))
    candidatos.sort(key=lambda item: (
        -len(item[1]),
        item[0].pavilhao != achado.pavilhao,
        abs((item[0].noite - achado.noite).days),
        item[0].id,
    ))
    return candidatos


# Valida todo o lote antes de gravar o achado em cada aviso selecionado.
def confirmar_triagem(sessao, achado_id, aviso_ids):
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
        perda.situacao = "aguardando retirada"
        sessao.add(Ocorrencia(
            aviso_id=perda.id,
            tipo="objeto achado",
            descricao=f"Achado confirmado na triagem #{achado.id}: {achado.descricao}"[:200],
            data=date.today(),
        ))
    # Fecha o registro de entrada para evitar uma segunda retirada do mesmo lote.
    achado.situacao = "triado"
    sessao.commit()
    return perdas


# O serviço repassa os filtros; o repositório monta a consulta paginada no banco.
def listar_avisos(sessao, pavilhao=None, visitante_id=None, pagina=1):
    return repositorio_aviso.listar_avisos(sessao, pavilhao, visitante_id, pagina)


# A rota decide o 404 quando o repositório não encontra o aviso.
def buscar_aviso(sessao, aviso_id, usuario_id):
    return repositorio_aviso.buscar_aviso_por_id(sessao, aviso_id, usuario_id)


# A cartilha vincula a perda a um visitante e define procurando como situação inicial.
def criar_aviso(sessao, dados, usuario):
    if usuario.tipo != "visitante":
        return "O aviso de perda deve pertencer a um visitante."
    dados_do_aviso = {
        **dados,
        "situacao": "procurando",
        "visitante_id": usuario.id,
    }
    return repositorio_aviso.criar_aviso(sessao, dados_do_aviso)


# O balcão recebe o objeto mesmo quando o dono ainda é desconhecido.
def registrar_objeto_no_balcao(sessao, dados):
    return repositorio_aviso.criar_aviso(sessao, {
        **dados, "visitante_id": None, "situacao": "aguardando retirada",
    })


# Após conferir o dono, o balcão vincula o aviso uma única vez.
def vincular_visitante(sessao, aviso_id, visitante_id):
    aviso = repositorio_aviso.bloquear_aviso(sessao, aviso_id)
    if aviso is None:
        return None
    if aviso.visitante_id is not None or aviso.situacao != "aguardando retirada":
        return "Somente um objeto aguardando retirada e sem visitante pode ser vinculado."
    visitante = buscar_usuario_por_id(sessao, visitante_id)
    if visitante is None or visitante.tipo != "visitante":
        return "Selecione uma conta de visitante."
    aviso.visitante_id = visitante.id
    sessao.commit()
    sessao.refresh(aviso)
    return aviso
