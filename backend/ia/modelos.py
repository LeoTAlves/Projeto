from collections.abc import Callable
from dataclasses import dataclass
from typing import Generic, TypeVar

import configuracao
from jangada_ai import Agent, LLM
from jangada_ai.errors import LLMError


T = TypeVar("T")

# Esta ordem mantém Gemini como principal, OpenRouter gratuito como reserva e Claude como última opção.
PROVEDORES_E_MODELOS = (
    ("gemini", "gemini-3.5-flash-lite", "chave_do_gemini"),
    ("openrouter", "openrouter/free", "chave_do_openrouter"),
    ("anthropic", "claude-opus-5-5", "chave_do_claude"),
)


class ProvedoresIndisponiveis(Exception):
    pass


@dataclass
class RespostaDoAgente(Generic[T]):
    # O resultado mantém a resposta interpretada e a origem para conferência e testes.
    resposta: T
    provedor: str | None
    modelo: str | None
    ferramenta_executada: bool


def provedor_configurado():
    return bool(configuracao.chave_do_gemini or configuracao.chave_do_openrouter or configuracao.chave_do_claude)


class ModeloConfigurado:
    # Cria a cadeia na ordem definida e deixa o Jangada tentar uma reserva após a falha anterior.
    def __init__(self, modelo_gemini=None):
        self.modelo_gemini = modelo_gemini
        self.provedor_ultima_resposta = None
        self.modelo_ultima_resposta = None

    def complete(self, prompt, **opcoes):
        resposta = criar_modelo_com_fallback(
            modelo_gemini=self.modelo_gemini
        ).complete(prompt, **opcoes)
        self.provedor_ultima_resposta = resposta.provider
        self.modelo_ultima_resposta = resposta.model
        return resposta


# A cadeia usa somente provedores configurados e permite substituir o modelo Gemini nos testes.
def criar_modelo_com_fallback(chaves=None, modelo_gemini=None):
    if chaves is None:
        chaves = {
            nome_chave: getattr(configuracao, nome_chave)
            for _, _, nome_chave in PROVEDORES_E_MODELOS
        }
    modelos = [
        LLM(
            provedor,
            modelo_gemini if provedor == "gemini" and modelo_gemini else modelo,
            api_key=chaves[nome_chave],
        )
        for provedor, modelo, nome_chave in PROVEDORES_E_MODELOS
        if chaves.get(nome_chave)
    ]
    if not modelos:
        raise ProvedoresIndisponiveis("Configure um provedor de IA no servidor.")
    return modelos[0].with_fallback(*modelos[1:]) if len(modelos) > 1 else modelos[0]


llm = ModeloConfigurado()


# A chamada direta usa a mesma cadeia Jangada e valida o texto antes de interpretá-lo.
def gerar_resposta(prompt: str, interpretar: Callable[[str], T], system: str | None = None) -> T:
    try:
        opcoes = {"system": system} if system else {}
        resposta = llm.complete(prompt, **opcoes)
    except LLMError as erro:
        raise ProvedoresIndisponiveis(
            "Nenhum provedor de IA retornou uma resposta."
        ) from erro

    texto = resposta.text
    if not isinstance(texto, str) or not texto.strip():
        raise ProvedoresIndisponiveis(
            "O provedor de IA retornou uma resposta vazia."
        )
    try:
        return interpretar(texto)
    except ValueError as erro:
        raise ProvedoresIndisponiveis(
            "Os provedores de IA não retornaram uma sugestão válida."
        ) from erro


# O Agent obriga a execução da tool local e devolve a origem da resposta para validação.
def gerar_resposta_com_agente(
    prompt: str,
    interpretar: Callable[[str], T],
    ferramenta: Callable[[], object],
    system: str,
    modelo_gemini: str | None = None,
) -> RespostaDoAgente[T]:
    modelo = ModeloConfigurado(modelo_gemini)
    agente = Agent(
        modelo,
        role="Auxiliar de achados e perdidos",
        goal=(
            "Comparar o objeto com os avisos fornecidos. Executar a ferramenta "
            f"{ferramenta.__name__} antes de sugerir qualquer correspondência."
        ),
        backstory=system,
        tools=[ferramenta],
        max_iterations=3,
    )
    try:
        resultado_agente = agente.run(prompt)
    except LLMError as erro:
        raise ProvedoresIndisponiveis(
            "Nenhum provedor de IA retornou uma resposta."
        ) from erro

    chamada_valida = any(
        getattr(item.get("call"), "name", None) == ferramenta.__name__
        and not item.get("is_error")
        for item in resultado_agente.tool_trace
    )
    if resultado_agente.stopped_by_limit or not chamada_valida:
        raise ProvedoresIndisponiveis(
            "O agente não concluiu a comparação usando a ferramenta local."
        )

    texto = resultado_agente.text
    if not isinstance(texto, str) or not texto.strip():
        raise ProvedoresIndisponiveis(
            "O agente de IA retornou uma resposta vazia."
        )
    try:
        resposta = interpretar(texto)
    except ValueError as erro:
        raise ProvedoresIndisponiveis(
            "O agente de IA não retornou uma sugestão válida."
        ) from erro
    return RespostaDoAgente(
        resposta=resposta,
        provedor=modelo.provedor_ultima_resposta,
        modelo=modelo.modelo_ultima_resposta,
        ferramenta_executada=chamada_valida,
    )
