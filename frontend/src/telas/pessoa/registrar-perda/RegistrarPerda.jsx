import { useState } from 'react';
import { criarAviso, registrarObjetoBalcao } from '../../../servicos/api';

// A tela de visitante registra o aviso novo com descrição, pavilhão e noite.
function RegistrarPerda({ visitanteId, peloBalcao = false }) {
  const [descricao, setDescricao] = useState('');
  const [pavilhao, setPavilhao] = useState('Pavilhao 1');
  const [noite, setNoite] = useState(peloBalcao ? '' : '2026-10-10');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState(false);
  const [carregando, setCarregando] = useState(false);

  // O envio usa o visitante escolhido no perfil e mostra claramente sucesso ou falha.
  const enviarFormulario = (evento) => {
    evento.preventDefault();
    setCarregando(true);
    setMensagem('');
    setErro(false);

    const registrar = peloBalcao ? registrarObjetoBalcao : criarAviso;
    registrar({
      descricao,
      pavilhao,
      noite,
      visitante_id: visitanteId,
    })
      .then((resultado) => {
        setMensagem(`Aviso ${resultado.id} registrado com a situação ${resultado.situacao}.`);
        setDescricao('');
        setPavilhao('Pavilhao 1');
        setNoite(peloBalcao ? '' : '2026-10-10');
      })
      .catch((falha) => {
        setErro(true);
        setMensagem(falha.message);
      })
      .finally(() => setCarregando(false));
  };

  return (
    <section className="cartao">
      <h3>{peloBalcao ? 'Registrar objeto encontrado' : 'Registrar perda'}</h3>
      <p className="texto-apoio">{peloBalcao
        ? 'Registre o objeto recebido. O visitante pode ser vinculado mais tarde na tela A ocorrência.'
        : 'Conte o que você perdeu. Quanto mais detalhes, mais fácil reconhecer.'}</p>
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
            placeholder={peloBalcao ? 'Descreva o objeto encontrado' : 'Descreva o objeto perdido'}
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
          {carregando ? 'Salvando...' : peloBalcao ? 'Registrar objeto' : 'Enviar aviso'}
        </button>
      </form>

      {mensagem && <p className={erro ? 'mensagem erro' : 'mensagem sucesso'} role="status">{mensagem}</p>}
    </section>
  );
}

export default RegistrarPerda;

