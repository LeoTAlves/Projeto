from collections.abc import Callable
from typing import TypeVar

import configuracao
from jangada_ai import LLM
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


def provedor_configurado():
    return bool(configuracao.chave_do_gemini or configuracao.chave_do_openrouter or configuracao.chave_do_claude)


class ModeloConfigurado:
    # Cria a cadeia na ordem definida e deixa o Jangada tentar uma reserva após a falha anterior.
    def complete(self, prompt, **opcoes):
        return criar_modelo_com_fallback().complete(prompt, **opcoes)


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


# A chamada converte erros do provedor, respostas vazias e formatos inválidos em uma falha recuperável.
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
