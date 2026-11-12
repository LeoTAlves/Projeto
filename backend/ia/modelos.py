from collections.abc import Callable
from typing import TypeVar

import configuracao
from jangada_ai import LLM
from jangada_ai.errors import LLMError

from ia.ferramentas import INSTRUCAO_SISTEMA


T = TypeVar("T")


class ProvedoresIndisponiveis(Exception):
    pass


def provedor_configurado():
    return bool(configuracao.chave_do_gemini or configuracao.chave_do_openrouter or configuracao.chave_do_claude)


class ModeloConfigurado:
    # Carrega apenas provedores com credenciais disponíveis, sem impedir a inicialização da API.
    def complete(self, prompt, **opcoes):
        modelos = [
            LLM(provedor, modelo, api_key=chave)
            for provedor, modelo, chave in (
                ("gemini", "gemini-3.5-flash-lite", configuracao.chave_do_gemini),
                ("openrouter", "openrouter/free", configuracao.chave_do_openrouter),
                ("anthropic", "claude-opus-5-5", configuracao.chave_do_claude),
            )
            if chave
        ]
        if not modelos:
            raise ProvedoresIndisponiveis("Configure um provedor de IA no servidor.")
        modelo = modelos[0].with_fallback(*modelos[1:]) if len(modelos) > 1 else modelos[0]
        return modelo.complete(prompt, **opcoes)


llm = ModeloConfigurado()


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
