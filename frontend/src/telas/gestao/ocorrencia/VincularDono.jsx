import { useState } from 'react';
import { listarVisitantes, vincularVisitante } from '../../../servicos/api';

// Vincular o aviso disponibiliza o código de retirada na conta selecionada.
export default function VincularDono({ avisoId, aoVincular }) {
  const [visitantes, setVisitantes] = useState(null);
  const [visitanteId, setVisitanteId] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');

  async function carregar() {
    setOcupado(true);
    setErro('');
    try {
      setVisitantes(await listarVisitantes());
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setOcupado(false);
    }
  }

  async function vincular() {
    setOcupado(true);
    setErro('');
    try {
      aoVincular(await vincularVisitante(avisoId, Number(visitanteId)));
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="painel-retirada">
      <strong>Objeto sem visitante vinculado</strong>
      <p>Confira a descrição e os detalhes do objeto com a pessoa. Em seguida, vincule o aviso à conta dela.</p>
      {visitantes === null ? (
        <button type="button" className="botao-secundario" disabled={ocupado} onClick={carregar}>
          {ocupado ? 'Consultando...' : 'Selecionar visitante'}
        </button>
      ) : visitantes.length === 0 ? (
        <p>Nenhum visitante cadastrado. A pessoa precisa criar uma conta primeiro.</p>
      ) : (
        <>
          <label>
            Conta do visitante
            <select value={visitanteId} disabled={ocupado} onChange={(evento) => setVisitanteId(evento.target.value)}>
              <option value="">Selecione pelo nome e e-mail</option>
              {visitantes.map((visitante) => (
                <option key={visitante.id} value={visitante.id}>{visitante.nome} · {visitante.email}</option>
              ))}
            </select>
          </label>
          <button type="button" className="botao-secundario" disabled={ocupado || !visitanteId} onClick={vincular}>
            {ocupado ? 'Vinculando...' : 'Confirmar vínculo'}
          </button>
        </>
      )}
      {erro && <p className="mensagem erro" role="alert">{erro}</p>}
    </div>
  );
}
