import { useState } from 'react';
import { corrigirVinculo } from '../../../servicos/api';

// O balcão pode desfazer uma correspondência equivocada antes da devolução.
export default function CorrigirVinculo({ aviso, aoAtualizar }) {
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');

  // A confirmação evita desvincular o aviso por um clique acidental.
  async function corrigir() {
    if (!window.confirm('Desfazer este vínculo e invalidar o código de retirada?')) return;
    setOcupado(true);
    setErro('');
    try {
      aoAtualizar(await corrigirVinculo(aviso.id));
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="painel-retirada">
      <button type="button" className="botao-secundario" disabled={ocupado} onClick={corrigir}>
        {ocupado ? 'Corrigindo...' : 'Corrigir vínculo'}
      </button>
      {erro && <p className="mensagem erro" role="alert">{erro}</p>}
    </div>
  );
}
