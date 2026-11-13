"""Compara os três primeiros resultados com exemplos fictícios, sem consultar o banco."""
from datetime import date
from types import SimpleNamespace
from unittest.mock import patch

from ia.modelos import ProvedoresIndisponiveis, provedor_configurado
from ia.sugestao import SugestaoIACriar, sugerir_correspondencias
from servicos.aviso import triar_objeto


def objeto(id_, descricao, categoria, cor, marca, pavilhao):
    return SimpleNamespace(
        id=id_, descricao=descricao, categoria=categoria, cor=cor, marca=marca,
        pavilhao=pavilhao, noite=date(2026, 10, 10), situacao="procurando",
    )


CASOS = [
    (
        objeto(100, "Smartphone escuro com capa amarela", "Celulares e eletrônicos", "preto", "Samsung", "Pavilhao 1"),
        [
            objeto(1, "Celular preto Samsung com proteção dourada", "Celulares e eletrônicos", "preto", "Samsung", "Pavilhao 2"),
            objeto(2, "Smartphone escuro com capa azul Motorola", "Celulares e eletrônicos", "preto", "Motorola", "Pavilhao 1"),
            objeto(3, "Smartphone escuro com capa cinza Apple", "Celulares e eletrônicos", "preto", "Apple", "Pavilhao 1"),
            objeto(4, "Smartphone escuro com capa branca Xiaomi", "Celulares e eletrônicos", "preto", "Xiaomi", "Pavilhao 1"),
        ],
        1,
    ),
    (
        objeto(101, "Mochila azul com fecho verde", "Bolsas e mochilas", "azul", "Nike", "Pavilhao 2"),
        [
            objeto(5, "Mochila azul Nike com fecho verde", "Bolsas e mochilas", "azul", "Nike", "Pavilhao 2"),
            objeto(6, "Mochila azul Adidas com fecho preto", "Bolsas e mochilas", "azul", "Adidas", "Pavilhao 2"),
            objeto(7, "Bolsa azul Nike", "Bolsas e mochilas", "azul", "Nike", "Pavilhao 3"),
        ],
        5,
    ),
]


def principal():
    acertos_texto = 0
    acertos_ia = 0
    avaliados_ia = 0
    for achado, avisos, correto in CASOS:
        with patch("servicos.aviso.repositorio_aviso.percorrer_perdas_abertas", return_value=avisos):
            texto = [aviso.id for aviso, _ in triar_objeto(None, achado)[:3]]
        acertos_texto += correto in texto
        print(f"Caso {achado.id}: esperado {correto}, texto {texto}")
        if provedor_configurado():
            entrada = SugestaoIACriar(
                categoria=achado.categoria, cor=achado.cor, marca=achado.marca,
                caracteristicas_distintivas=achado.descricao, pavilhao=achado.pavilhao, noite=achado.noite,
            )
            try:
                with patch("ia.sugestao.listar_avisos_para_sugestao", return_value=avisos):
                    resposta = sugerir_correspondencias(None, entrada)
                ids = [item.aviso_id for item in resposta.correspondencias[:3]]
                avaliados_ia += 1
                acertos_ia += correto in ids
                print(f"IA: {ids}")
            except ProvedoresIndisponiveis:
                print("IA indisponível para este caso.")
    print(f"Texto, acertos nos três primeiros: {acertos_texto}/{len(CASOS)}")
    if avaliados_ia:
        print(f"IA, acertos nos três primeiros: {acertos_ia}/{avaliados_ia} ({avaliados_ia}/{len(CASOS)} casos avaliados)")
    else:
        print("IA sem resultado avaliável. Configure um provedor para medir a comparação.")


if __name__ == "__main__":
    principal()
