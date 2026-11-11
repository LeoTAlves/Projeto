import unittest
from datetime import date
from types import SimpleNamespace
from unittest.mock import ANY, Mock, patch

from esquemas.ia import CorrespondenciaIA, SugestaoIACriar, SugestaoIAModelo
from ia.modelos import ProvedoresIndisponiveis, gerar_resposta
from ia.sugestao import sugerir_correspondencias


class TestSugestaoIA(unittest.TestCase):
    def test_usa_llm_com_resposta_do_provedor(self):
        interpretador = Mock(return_value="interpretado")
        with patch(
            "ia.modelos.llm.complete",
            return_value=SimpleNamespace(text='{"ok": true}'),
        ) as completar:
            resultado = gerar_resposta("prompt", interpretador)

        self.assertEqual(resultado, "interpretado")
        completar.assert_called_once_with("prompt", system=ANY)
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
            ),
            SimpleNamespace(
                id=11,
                descricao="Mochila azul",
                pavilhao="Pavilhao 2",
                noite=date(2026, 10, 10),
                situacao="procurando",
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
                    caracteristicas_compativeis=["categoria", "cor", "modelo"],
                    explicacao="Categoria, cor e modelo compatíveis.",
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
            categoria="mochila",
            cor="azul",
            marca="Marca A",
            modelo="M1",
        )

        with (
            patch("ia.sugestao.listar_avisos_para_sugestao", return_value=avisos),
            patch("ia.sugestao.gerar_resposta", return_value=resposta),
        ):
            resultado = sugerir_correspondencias(None, dados)

        self.assertEqual(resultado.situacao, "sugerida")
        self.assertEqual([item.aviso_id for item in resultado.correspondencias], [11, 10])
        self.assertFalse(resultado.correspondencias[0].bloqueado)
        self.assertTrue(resultado.correspondencias[1].bloqueado)
        self.assertEqual(resultado.correspondencias[1].situacao, "devolvido")


if __name__ == "__main__":
    unittest.main()
