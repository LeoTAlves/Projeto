import { useState } from 'react';
import { registrarObjetoBalcao } from '../../../servicos/api';

// O balcão cadastra o achado em um único campo e pode ir direto à triagem.
export default function RegistrarAchado({ aoAbrirAviso }) {
  const [descricao, setDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  // Mantém a descrição disponível para nova tentativa quando a gravação falha.
  async function registrar(evento) {
    evento.preventDefault();
    const texto = descricao.trim();
    if (salvando || texto.length < 3) return;
    setSalvando(true);
    setErro('');
    try {
      const achado = await registrarObjetoBalcao({ descricao: texto });
      aoAbrirAviso(achado.id);
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
            value={descricao} disabled={salvando}
            placeholder="Ex. Mochila preta com zíper vermelho"
            onChange={(evento) => setDescricao(evento.target.value)} />
        </label>
        <button type="submit" disabled={salvando || descricao.trim().length < 3}>
          {salvando ? 'Salvando...' : 'Registrar objeto'}
        </button>
      </form>
      {erro && <p className="mensagem erro" role="alert">{erro}</p>}
    </section>
  );
}
