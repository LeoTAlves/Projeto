import json

from pydantic import ValidationError

from ia.ferramentas import contar_caracteristicas, montar_prompt
from ia.modelos import gerar_resposta
from esquemas.ia import (
    SugestaoIACriar,
    SugestaoIAModelo,
    SugestaoIAResposta,
)
from repositorios.aviso import listar_avisos_para_sugestao


def _interpretar_resposta(texto: str) -> SugestaoIAModelo:
    try:
        dados = json.loads(texto)
    except json.JSONDecodeError as erro:
        raise ValueError("O provedor não retornou JSON válido.") from erro
    try:
        return SugestaoIAModelo.model_validate(dados)
    except ValidationError as erro:
        raise ValueError("O provedor retornou um formato de sugestão inválido.") from erro


def sugerir_correspondencias(sessao, dados: SugestaoIACriar) -> SugestaoIAResposta:
    objeto = dados.model_dump()
    caracteristicas = contar_caracteristicas(objeto)
    if len(caracteristicas) < 3:
        return SugestaoIAResposta(
            situacao="informacoes_insuficientes",
            mensagem="Informe pelo menos três características do objeto para solicitar sugestões.",
        )

    avisos = listar_avisos_para_sugestao(sessao)
    if not avisos:
        return SugestaoIAResposta(
            situacao="sem_correspondencias",
            mensagem="Não há avisos cadastrados para comparar. Continue pela conferência manual.",
        )

    dados_avisos = [
        {
            "id": aviso.id,
            "descricao": aviso.descricao,
            "pavilhao": aviso.pavilhao,
            "noite": aviso.noite.isoformat(),
            "situacao": aviso.situacao,
        }
        for aviso in avisos
    ]
    resposta = gerar_resposta(
        montar_prompt(objeto, dados_avisos),
        _interpretar_resposta,
    )
    avisos_por_id = {aviso.id: aviso for aviso in avisos}
    sugestoes = []
    ids_sugeridos = set()
    for sugestao in resposta.correspondencias:
        aviso = avisos_por_id.get(sugestao.aviso_id)
        campos_compativeis = set(sugestao.caracteristicas_compativeis)
        if (
            aviso is None
            or sugestao.aviso_id in ids_sugeridos
            or len(campos_compativeis) < 3
            or not campos_compativeis.issubset(caracteristicas)
        ):
            continue
        ids_sugeridos.add(aviso.id)
        sugestoes.append(
            {
                **sugestao.model_dump(),
                "situacao": aviso.situacao,
                "bloqueado": aviso.situacao == "devolvido",
            }
        )

    sugestoes.sort(
        key=lambda item: (
            item["situacao"] != "procurando",
            -item["pontuacao"],
            item["aviso_id"],
        )
    )
    return SugestaoIAResposta(
        situacao="sugerida" if sugestoes else "sem_correspondencias",
        mensagem=(
            resposta.mensagem
            if sugestoes
            else "Nenhuma sugestão válida foi encontrada. Continue pela conferência manual."
        ),
        correspondencias=sugestoes,
    )


__all__ = ["sugerir_correspondencias"]
