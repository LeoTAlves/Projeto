import logging
from types import SimpleNamespace

from ia.comparacao_local import extrair_atributos, palavras, SINONIMOS
from ia.modelos import ProvedoresIndisponiveis, provedor_configurado
from ia.sugestao import SugestaoIACriar, sugerir_correspondencias
from repositorios.aviso import percorrer_achados_disponiveis, percorrer_perdas_abertas
from servicos.aviso import confirmar_triagem, termos_da_descricao


logger = logging.getLogger(__name__)
CAMPOS = ("categoria", "cor", "marca")


# Preenche atributos ausentes somente para comparar, sem alterar o cadastro.
def perfil(aviso):
    extras = extrair_atributos(aviso.descricao)
    atributos = {campo: getattr(aviso, campo) or getattr(extras, campo) for campo in CAMPOS}
    termos = {SINONIMOS.get(termo, termo) for termo in termos_da_descricao(aviso.descricao)}
    return atributos, termos


# Divergências explícitas excluem o par; descrições genéricas exigem mais evidência.
def compatibilidade(origem, candidato):
    atributos, termos = origem
    outros, outros_termos = candidato
    preenchidos = [campo for campo in CAMPOS if atributos[campo] and outros[campo]]
    if any(palavras(atributos[campo]) != palavras(outros[campo]) for campo in preenchidos):
        return False
    comuns = termos & outros_termos
    cobertura = 2 * len(comuns) / max(1, len(termos) + len(outros_termos))
    return len(comuns) >= 3 and cobertura >= 0.75 and (len(preenchidos) >= 2 or len(comuns) >= 4)


# Se houver dois candidatos plausíveis, a entrega permanece pendente.
def candidato_unico(aviso, candidatos):
    origem = perfil(aviso)
    escolhido = None
    for candidato in candidatos:
        if compatibilidade(origem, perfil(candidato)):
            if escolhido is not None:
                return None
            escolhido = candidato
    return escolhido


# Confere o par com o agente quando configurado. A comparação local cobre sua indisponibilidade.
def agente_confirma(sessao, achado, perda):
    if not provedor_configurado():
        return True
    atributos, _ = perfil(achado)
    atributos_perda, _ = perfil(perda)
    dados = SugestaoIACriar(**atributos, caracteristicas_distintivas=achado.descricao)
    candidato = SimpleNamespace(id=perda.id, descricao=perda.descricao, pavilhao=perda.pavilhao,
                                noite=perda.noite, situacao=perda.situacao, **atributos_perda)
    try:
        resposta = sugerir_correspondencias(sessao, dados, avisos=[candidato])
    except ProvedoresIndisponiveis:
        return True
    if resposta.situacao == "informacoes_insuficientes":
        return True
    return any(item.aviso_id == perda.id and item.pontuacao >= 8 for item in resposta.correspondencias)


# Compara nos dois sentidos antes de reaproveitar a gravação transacional da triagem.
def triar_ao_registrar(sessao, aviso):
    try:
        if aviso.visitante_id is None:
            achado = aviso
            perda = candidato_unico(achado, percorrer_perdas_abertas(sessao))
            if perda is None or candidato_unico(perda, percorrer_achados_disponiveis(sessao)) != achado:
                return None
        else:
            perda = aviso
            achado = candidato_unico(perda, percorrer_achados_disponiveis(sessao))
            if achado is None or candidato_unico(achado, percorrer_perdas_abertas(sessao)) != perda:
                return None
        if not agente_confirma(sessao, achado, perda):
            return None
        resultado = confirmar_triagem(sessao, achado.id, [perda.id], None, automatica=True)
        return resultado[0].id if isinstance(resultado, list) else None
    except Exception:
        # O cadastro já foi confirmado e segue disponível para a próxima análise.
        sessao.rollback()
        logger.exception("Falha na triagem automática de um aviso.")
        return None
