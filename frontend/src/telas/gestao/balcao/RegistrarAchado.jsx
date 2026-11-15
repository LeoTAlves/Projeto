import { useState } from 'react';
import { registrarObjetoBalcao } from '../../../servicos/api';
import { analisarDescricao, contextoDaDescricao, descricaoGenerica } from '../../../servicos/descricaoObjeto';

// O balcão cadastra o achado em um único campo e pode ir direto à triagem.
export default function RegistrarAchado({ aoAbrirAviso }) {
  const [descricao, setDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [analise, setAnalise] = useState(null);
  const [analisando, setAnalisando] = useState(false);

  // A prévia usa a mesma descrição que a equipe pode corrigir antes do registro.
  async function analisar() {
    setAnalisando(true);
    setErro('');
    try {
      setAnalise(await analisarDescricao(descricao));
    } catch {
      setErro('A análise está indisponível. Você pode salvar pela descrição.');
    } finally {
      setAnalisando(false);
    }
  }

  // Mantém a descrição disponível para nova tentativa quando a gravação falha.
  async function registrar(evento) {
    evento.preventDefault();
    const texto = descricao.trim();
    if (salvando || analisando || texto.length < 3) return;
    setSalvando(true);
    setErro('');
    try {
      const achado = await registrarObjetoBalcao({
        ...contextoDaDescricao(texto), ...analise, descricao: texto,
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
      <form className="formulario" onSubmit={registrar}>
        <label>
          Descrição do objeto
          <textarea required minLength={3} maxLength={200} rows={4}
            value={descricao} disabled={salvando || analisando}
            placeholder="Ex. Mochila preta com zíper vermelho"
            onChange={(evento) => { setDescricao(evento.target.value); setAnalise(null); }} />
        </label>
        {descricaoGenerica(descricao) && (
          <small>Se houver, inclua uma marca, risco, adesivo ou acessório à descrição.</small>
        )}
        {analise && (
          <p role="status">{[analise.categoria, analise.cor, analise.marca,
            analise.pavilhao?.replace('Pavilhao', 'Pavilhão'), analise.noite?.split('-').reverse().join('/')]
            .filter(Boolean).join(' · ') || 'Nenhum atributo identificado. A descrição pode ser salva.'}</p>
        )}
        <button type="button" className="botao-secundario" onClick={analisar}
          disabled={salvando || analisando || descricao.trim().length < 3}>
          {analisando ? 'Analisando...' : 'Identificar detalhes com IA'}
        </button>
        <button type="submit" disabled={salvando || analisando || descricao.trim().length < 3}>
          {salvando ? 'Salvando...' : 'Registrar objeto'}
        </button>
      </form>
      {erro && <p className="mensagem erro" role="alert">{erro}</p>}
    </section>
  );
}
