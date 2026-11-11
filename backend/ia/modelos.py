from collections.abc import Callable
from typing import TypeVar

import configuracao
from jangada_ai import LLM
from jangada_ai.errors import LLMError

from ia.ferramentas import INSTRUCAO_SISTEMA


T = TypeVar("T")


class ProvedoresIndisponiveis(Exception):
    pass


gemini = LLM(
    "gemini",
    "gemini-3.5-flash-lite",
    api_key=configuracao.chave_do_gemini,
)
openrouter = LLM(
    "openrouter",
    "openrouter/free",
    api_key=configuracao.chave_do_openrouter,
)
claude = LLM(
    "anthropic",
    "claude-opus-5-5",
    api_key=configuracao.chave_do_claude,
)
llm = gemini.with_fallback(openrouter, claude)


def gerar_resposta(prompt: str, interpretar: Callable[[str], T]) -> T:
    try:
        resposta = llm.complete(prompt, system=INSTRUCAO_SISTEMA)
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
