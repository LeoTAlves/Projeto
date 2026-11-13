import unittest
from datetime import date
from types import SimpleNamespace
from unittest.mock import Mock, patch

from fastapi import HTTPException
from jangada_ai.message import Completion, ToolCall

from esquemas.aviso import DescricaoObjeto
from ia.ferramentas import calcular_compatibilidades, criar_tool_calcular_compatibilidades
from ia.modelos import (
    ProvedoresIndisponiveis,
    criar_modelo_com_fallback,
    gerar_resposta,
    gerar_resposta_com_agente,
)
from ia.sugestao import (
    CorrespondenciaIA,
    SugestaoIACriar,
    SugestaoIAModelo,
    sugerir_atributos,
    sugerir_correspondencias,
)


class TestSugestaoIA(unittest.TestCase):
    # A rota traduz a indisponibilidade dos provedores em 503 sem tentar gravar dados.
    def test_rota_responde_503_quando_provedores_nao_respondem(self):
        from rotas.ia import criar_sugestoes

        with (
            patch(
                "rotas.ia.sugerir_correspondencias",
                side_effect=ProvedoresIndisponiveis("falha fictícia"),
            ),
            self.assertRaises(HTTPException) as erro,
        ):
            criar_sugestoes(
                SugestaoIACriar(categoria="Mochila", cor="azul", marca="Marca A"),
                usuario=object(),
                sessao=object(),
            )

        self.assertEqual(erro.exception.status_code, 503)
        self.assertEqual(
            erro.exception.detail,
            "A IA não respondeu. Continue pela conferência manual.",
        )

    # A função consulta candidatos, mas não confirma a sugestão nem chama commit na sessão.
    def test_sugestao_nao_grava_quando_provedor_falha(self):
        sessao = Mock()
        aviso = SimpleNamespace(
            id=301,
            descricao="Mochila azul Marca A bolso lateral amarelo",
            pavilhao="Pavilhao 1",
            noite=date(2026, 10, 10),
            situacao="procurando",
            categoria="Bolsas e mochilas",
            cor="azul",
            marca="Marca A",
        )
        dados = SugestaoIACriar(
            categoria="Bolsas e mochilas",
            cor="azul",
            marca="Marca A",
            caracteristicas_distintivas="bolso lateral amarelo",
        )

        with (
            patch("ia.sugestao.listar_avisos_para_sugestao", return_value=[aviso]),
            patch(
                "ia.sugestao.gerar_resposta_com_agente",
                side_effect=ProvedoresIndisponiveis("falha fictícia"),
            ),
            self.assertRaises(ProvedoresIndisponiveis),
        ):
            sugerir_correspondencias(sessao, dados)

        sessao.commit.assert_not_called()

    # A rota de atributos conserva a extração local quando todos os provedores estão indisponíveis.
    def test_sugere_atributos_localmente_sem_provedor(self):
        with patch(
            "ia.sugestao.gerar_resposta",
            side_effect=ProvedoresIndisponiveis("falha fictícia"),
        ):
            resultado = sugerir_atributos(DescricaoObjeto(descricao="mochila azul"))

        self.assertEqual(resultado.categoria, "Bolsas e mochilas")
        self.assertEqual(resultado.cor, "azul")

    # A comparação determinística reconhece diferenças de caixa e acentos nos atributos estruturados.
    def test_calcula_compatibilidades_com_dados_ficticios(self):
        objeto = {
            "categoria": "Óculos",
            "cor": "PRETO",
            "marca": "VisãoSul",
            "modelo": "retangular",
            "caracteristicas_distintivas": "haste direita com pequeno arranhão",
        }
        avisos = [
            {
                "id": 101,
                "categoria": "óculos",
                "cor": "preto",
                "marca": "visãosul",
                "modelo": "Retangular",
                "descricao": "haste direita com pequeno arranhão",
            },
            {
                "id": 102,
                "categoria": "óculos",
                "cor": "preto",
                "marca": "OutraMarca",
                "modelo": "redondo",
                "descricao": "estojo vermelho",
            },
        ]

        resultado = calcular_compatibilidades(objeto, avisos)

        self.assertEqual(
            resultado,
            [{
                "aviso_id": 101,
                "caracteristicas_compativeis": [
                    "categoria",
                    "cor",
                    "marca",
                    "modelo",
                    "caracteristicas_distintivas",
                ],
            }],
        )

    # Campos ausentes e identificadores inválidos não podem completar o mínimo de três atributos.
    def test_ignora_campos_ausentes_e_ids_invalidos_no_calculo(self):
        objeto = {
            "categoria": "Mochila",
            "cor": "azul",
            "marca": "Marca A",
            "modelo": "M1",
            "caracteristicas_distintivas": "bolso lateral com zíper",
        }
        avisos = [
            {"id": 201, "categoria": "mochila", "cor": "azul"},
            {
                "id": 202,
                "categoria": "mochila",
                "cor": "azul",
                "marca": "Marca A",
                "modelo": "M1",
            },
            {
                "id": True,
                "categoria": "mochila",
                "cor": "azul",
                "marca": "Marca A",
                "modelo": "M1",
            },
        ]

        resultado = calcular_compatibilidades(objeto, avisos)

        self.assertEqual(
            resultado,
            [{
                "aviso_id": 202,
                "caracteristicas_compativeis": ["categoria", "cor", "marca", "modelo"],
            }],
        )

    # Chaves fictícias e falha simulada permitem testar o fallback do Jangada sem chamadas externas.
    def test_jangada_usa_openrouter_quando_modelo_gemini_falha(self):
        from jangada_ai.errors import NotFoundError

        modelo = criar_modelo_com_fallback(
            {
                "chave_do_gemini": "chave-ficticia-gemini",
                "chave_do_openrouter": "chave-ficticia-openrouter",
                "chave_do_claude": "chave-ficticia-claude",
            },
            modelo_gemini="modelo-inexistente",
        )
        gemini, openrouter, claude = modelo._candidates()
        resposta_reserva = Completion(
            text="resposta fictícia",
            model="openrouter/free",
            provider="openrouter",
        )

        with (
            patch.object(
                gemini.provider,
                "complete",
                side_effect=NotFoundError("modelo inexistente"),
            ),
            patch.object(
                openrouter.provider,
                "complete",
                return_value=resposta_reserva,
            ) as completar_openrouter,
            patch.object(claude.provider, "complete") as completar_claude,
        ):
            resposta = modelo.complete("pedido fictício")

        self.assertEqual(gemini.model, "modelo-inexistente")
        self.assertEqual(resposta.provider, "openrouter")
        completar_openrouter.assert_called_once()
        completar_claude.assert_not_called()

    # O Agent executa a tool local entre duas respostas do modelo e interpreta a resposta final.
    def test_agent_executa_tool_de_compatibilidade(self):
        avisos = [{
            "id": 401,
            "categoria": "Mochila",
            "cor": "azul",
            "marca": "Marca A",
        }]
        objeto = {
            "categoria": "Mochila",
            "cor": "azul",
            "marca": "Marca A",
        }
        ferramenta = criar_tool_calcular_compatibilidades(objeto, avisos)
        chamada_tool = Completion(
            text="",
            model="modelo-ficticio",
            provider="openrouter",
            tool_calls=[ToolCall(id="tool-1", name=ferramenta.__name__, args={})],
        )
        resposta_final = Completion(
            text='{"ok": true}',
            model="modelo-ficticio",
            provider="openrouter",
        )
        modelo_falso = Mock()
        modelo_falso.complete.side_effect = [chamada_tool, resposta_final]

        with patch("ia.modelos.criar_modelo_com_fallback", return_value=modelo_falso):
            resultado = gerar_resposta_com_agente(
                "pedido fictício",
                lambda texto: texto,
                ferramenta,
                system="instrução fictícia",
            )

        self.assertEqual(resultado.resposta, '{"ok": true}')
        self.assertEqual(resultado.provedor, "openrouter")
        self.assertTrue(resultado.ferramenta_executada)
        self.assertEqual(modelo_falso.complete.call_count, 2)
        retorno_tool = modelo_falso.complete.call_args_list[1].kwargs["history"][-1].content[0]
        self.assertIn('"aviso_id": 401', retorno_tool.content)

    # O Agent usa a reserva OpenRouter após NotFoundError fictício no modelo Gemini.
    def test_agent_faz_fallback_de_gemini_inexistente_e_usa_tool(self):
        from jangada_ai import LLM
        from jangada_ai.errors import NotFoundError

        avisos = [{
            "id": 402,
            "categoria": "Mochila",
            "cor": "azul",
            "marca": "Marca A",
        }]
        ferramenta = criar_tool_calcular_compatibilidades(
            {"categoria": "Mochila", "cor": "azul", "marca": "Marca A"},
            avisos,
        )
        modelos = {
            "gemini": LLM("gemini", "modelo-inexistente", api_key="chave-ficticia"),
            "openrouter": LLM("openrouter", "openrouter/free", api_key="chave-ficticia"),
            "anthropic": LLM("anthropic", "claude-opus-5-5", api_key="chave-ficticia"),
        }
        resposta_tool = Completion(
            text="",
            model="openrouter/free",
            provider="openrouter",
            tool_calls=[ToolCall(id="tool-fallback", name=ferramenta.__name__, args={})],
        )
        resposta_final = Completion(
            text='{"ok": true}',
            model="openrouter/free",
            provider="openrouter",
        )

        with (
            patch("ia.modelos.configuracao.chave_do_gemini", "chave-ficticia"),
            patch("ia.modelos.configuracao.chave_do_openrouter", "chave-ficticia"),
            patch("ia.modelos.configuracao.chave_do_claude", "chave-ficticia"),
            patch("ia.modelos.LLM", side_effect=lambda provedor, modelo, api_key: modelos[provedor]),
            patch.object(
                modelos["gemini"].provider,
                "complete",
                side_effect=NotFoundError("modelo inexistente"),
            ),
            patch.object(
                modelos["openrouter"].provider,
                "complete",
                side_effect=[resposta_tool, resposta_final],
            ) as completar_openrouter,
            patch.object(modelos["anthropic"].provider, "complete") as completar_claude,
        ):
            resultado = gerar_resposta_com_agente(
                "pedido fictício",
                lambda texto: texto,
                ferramenta,
                system="instrução fictícia",
                modelo_gemini="modelo-inexistente",
            )

        self.assertEqual(resultado.provedor, "openrouter")
        self.assertEqual(resultado.resposta, '{"ok": true}')
        self.assertTrue(resultado.ferramenta_executada)
        self.assertEqual(completar_openrouter.call_count, 2)
        completar_claude.assert_not_called()

    def test_usa_llm_com_resposta_do_provedor(self):
        interpretador = Mock(return_value="interpretado")
        with patch(
            "ia.modelos.llm.complete",
            return_value=SimpleNamespace(text='{"ok": true}'),
        ) as completar:
            resultado = gerar_resposta("prompt", interpretador, system="instrução fictícia")

        self.assertEqual(resultado, "interpretado")
        completar.assert_called_once_with("prompt", system="instrução fictícia")
        interpretador.assert_called_once_with('{"ok": true}')

    def test_converte_falha_dos_provedores(self):
        from jangada_ai.errors import LLMError

        with (
            patch("ia.modelos.llm.complete", side_effect=LLMError("indisponível")),
            self.assertRaises(ProvedoresIndisponiveis),
        ):
            gerar_resposta("prompt", str)

    def test_pede_mais_informacoes_sem_chamar_provedor(self):
        with patch("ia.sugestao.gerar_resposta") as gerar:
            resultado = sugerir_correspondencias(
                None,
                SugestaoIACriar(categoria="mochila", cor="azul"),
            )

        self.assertEqual(resultado.situacao, "informacoes_insuficientes")
        gerar.assert_not_called()

    def test_descarta_ids_invalidos_e_bloqueia_avisos_devolvidos(self):
        avisos = [
            SimpleNamespace(
                id=10,
                descricao="Mochila azul",
                pavilhao="Pavilhao 1",
                noite=date(2026, 10, 10),
                situacao="devolvido",
                categoria="Bolsas e mochilas",
                cor="azul",
                marca="Marca A",
            ),
            SimpleNamespace(
                id=11,
                descricao="Mochila azul Marca A bolso lateral amarelo",
                pavilhao="Pavilhao 2",
                noite=date(2026, 10, 10),
                situacao="procurando",
                categoria="Bolsas e mochilas",
                cor="azul",
                marca="Marca A",
            ),
        ]
        resposta = SugestaoIAModelo(
            mensagem="Confira as descrições antes de registrar.",
            correspondencias=[
                CorrespondenciaIA(
                    aviso_id=10,
                    pontuacao=8,
                    caracteristicas_compativeis=["categoria", "cor", "marca"],
                    explicacao="Categoria, cor e marca compatíveis.",
                ),
                CorrespondenciaIA(
                    aviso_id=11,
                    pontuacao=7,
                    caracteristicas_compativeis=[
                        "categoria",
                        "cor",
                        "modelo",
                        "caracteristicas_distintivas",
                    ],
                    explicacao="Categoria, cor e detalhes descritos compatíveis.",
                ),
                CorrespondenciaIA(
                    aviso_id=999,
                    pontuacao=10,
                    caracteristicas_compativeis=["categoria", "cor", "marca"],
                    explicacao="Este aviso não existe.",
                ),
            ],
        )
        dados = SugestaoIACriar(
            categoria="Bolsas e mochilas",
            cor="azul",
            marca="Marca A",
            modelo="M1",
            caracteristicas_distintivas="bolso lateral com zíper amarelo",
        )

        with (
            patch("ia.sugestao.listar_avisos_para_sugestao", return_value=avisos),
            patch(
                "ia.sugestao.gerar_resposta_com_agente",
                return_value=SimpleNamespace(resposta=resposta),
            ),
        ):
            resultado = sugerir_correspondencias(None, dados)

        self.assertEqual(resultado.situacao, "sugerida")
        self.assertEqual([item.aviso_id for item in resultado.correspondencias], [11, 10])
        self.assertFalse(resultado.correspondencias[0].bloqueado)
        self.assertTrue(resultado.correspondencias[1].bloqueado)
        self.assertEqual(resultado.correspondencias[1].situacao, "devolvido")
        self.assertEqual(
            resultado.correspondencias[0].caracteristicas_compativeis,
            ["categoria", "cor", "caracteristicas_distintivas"],
        )


if __name__ == "__main__":
    unittest.main()
