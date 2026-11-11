import { useState } from 'react';
import { consultarCodigoRetirada } from '../servicos/api';

// A consulta ocorre somente quando o dono pede para ver o código.
export default function CodigoRetirada({ avisoId }) {
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function mostrar() {
    setErro('');
    setCarregando(true);
    try {
      const resposta = await consultarCodigoRetirada(avisoId);
      setCodigo(resposta.codigo);
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="painel-retirada">
      <strong>Retirada no balcão</strong>
      <p>Apresente este código à equipe no momento da retirada.</p>
      {codigo && <code className="codigo-retirada">{codigo}</code>}
      <button type="button" className="botao-secundario" disabled={carregando}
        onClick={codigo ? () => setCodigo('') : mostrar}>
        {codigo ? 'Ocultar código' : carregando ? 'Consultando...' : 'Mostrar código'}
      </button>
      {erro && <p className="mensagem erro" role="alert">{erro}</p>}
    </div>
  );
}
