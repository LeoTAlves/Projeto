import { useState } from 'react';
import { registrarObjetoBalcao } from '../../../servicos/api';
import { analisarDescricao, contextoDaDescricao, perguntasDeCalcado, revisarCampos } from '../../../servicos/descricaoObjeto';
import DetalhesDoObjeto from '../../../componentes/DetalhesDoObjeto';
import CamposDoObjeto from '../../../componentes/CamposDoObjeto';

// A descrição inicia o cadastro e o balcão revisa os atributos antes da triagem.
export default function RegistrarAchado({ aoAbrirAviso }) {
  const [descricao, setDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [dados, setDados] = useState({ categoria: '', cor: '', marca: '', pavilhao: '', noite: '' });
  const [revisando, setRevisando] = useState(false);
  const [analisando, setAnalisando] = useState(false);

  // Os atributos correspondem à descrição que foi analisada.
  function atualizarDescricao(texto) {
    setDescricao(texto);
  }

  // A prévia usa a mesma descrição que a equipe pode corrigir antes do registro.
  async function analisar() {
    setAnalisando(true);
    setErro('');
    let sugestao = contextoDaDescricao(descricao);
    try {
      sugestao = await analisarDescricao(descricao);
    } catch {
      setErro('A sugestão de atributos está indisponível. Complete os campos manualmente.');
    } finally {
      setDados(Object.fromEntries(Object.entries(dados)
        .map(([campo, valor]) => [campo, valor || sugestao[campo] || ''])));
      setRevisando(true);
      setAnalisando(false);
    }
  }

  // Mantém a descrição disponível para nova tentativa quando a gravação falha.
  async function registrar(evento) {
    evento.preventDefault();
    const texto = descricao.trim();
    if (salvando || analisando || texto.length < 3) return;
    if (perguntasDeCalcado(texto)?.length) {
      setErro('Complete os detalhes do calçado indicados no formulário.');
      return;
    }
    setSalvando(true);
    setErro('');
    try {
      const achado = await registrarObjetoBalcao({
        ...dados, descricao: texto,
      });
      aoAbrirAviso(achado.aviso_vinculado_id ?? achado.id);
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="cartao">
      <h2 className="titulo-atendimento">Registrar objeto encontrado</h2>
      <form onSubmit={registrar}>
        <fieldset className="formulario cadastro-equipe" disabled={salvando || analisando}>
        <label>
          Descrição do objeto
          <textarea required minLength={3} maxLength={200} rows={4}
            value={descricao} disabled={salvando || analisando}
            placeholder="Ex. Mochila preta com zíper vermelho"
            onChange={(evento) => atualizarDescricao(evento.target.value)} />
        </label>
        <DetalhesDoObjeto key={descricao + dados.categoria} descricao={descricao}
          categoria={dados.categoria} aoAcrescentar={atualizarDescricao} />
        <button type="button" className="botao-secundario" onClick={analisar}
          disabled={salvando || analisando || descricao.trim().length < 3}>
          {analisando ? 'Analisando...' : 'Preencher com ajuda da IA'}
        </button>
        {revisando && <p role="status">{revisarCampos(dados)}</p>}
        <CamposDoObjeto dados={dados} achado
          aoAlterar={(campo, valor) => setDados((atual) => ({ ...atual, [campo]: valor }))} />
        <button type="submit" disabled={salvando || analisando || descricao.trim().length < 3}>
          {salvando ? 'Salvando...' : 'Registrar objeto'}
        </button>
        </fieldset>
      </form>
      {erro && <p className="mensagem erro" role="alert">{erro}</p>}
    </section>
  );
}
