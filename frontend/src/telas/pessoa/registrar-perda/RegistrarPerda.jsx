import { useState } from 'react';
import { criarAviso } from '../../../servicos/api';

// A tela de visitante registra o aviso novo com descrição, pavilhão e noite.
function RegistrarPerda({ visitanteId }) {
  const [descricao, setDescricao] = useState('');
  const [pavilhao, setPavilhao] = useState('Pavilhao 1');
  const [noite, setNoite] = useState('2026-10-10');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState(false);
  const [carregando, setCarregando] = useState(false);

  // O envio usa o visitante escolhido no perfil e mostra claramente sucesso ou falha.
  const enviarFormulario = (evento) => {
    evento.preventDefault();
    setCarregando(true);
    setMensagem('');
    setErro(false);

    criarAviso({
      descricao,
      pavilhao,
      noite,
      visitante_id: visitanteId,
    })
      .then((resultado) => {
        setMensagem(`Aviso ${resultado.id} registrado com a situação procurando.`);
        setDescricao('');
        setPavilhao('Pavilhao 1');
        setNoite('2026-10-10');
      })
      .catch((falha) => {
        setErro(true);
        setMensagem(falha.message);
      })
      .finally(() => setCarregando(false));
  };

  return (
    <section className="cartao">
      <h3>Registrar perda</h3>
      <form onSubmit={enviarFormulario} className="formulario">
        <label>
          Descrição do objeto
          <textarea
            required
            minLength="3"
            maxLength="200"
            value={descricao}
            onChange={(evento) => setDescricao(evento.target.value)}
            rows="4"
            placeholder="Descreva o objeto perdido"
          />
        </label>

        <label>
          Pavilhão
          <select value={pavilhao} onChange={(evento) => setPavilhao(evento.target.value)}>
            <option value="Pavilhao 1">Pavilhão 1</option>
            <option value="Pavilhao 2">Pavilhão 2</option>
            <option value="Pavilhao 3">Pavilhão 3</option>
          </select>
        </label>

        <label>
          Noite
          <input
            required
            type="date"
            value={noite}
            onChange={(evento) => setNoite(evento.target.value)}
          />
        </label>

        <button type="submit" disabled={carregando}>
          {carregando ? 'Salvando...' : 'Enviar aviso'}
        </button>
      </form>

      {mensagem && <p className={erro ? 'mensagem erro' : 'mensagem'} role="status">{mensagem}</p>}
    </section>
  );
}

export default RegistrarPerda;

