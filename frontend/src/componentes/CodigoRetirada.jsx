import { useState } from 'react';
import { consultarCodigoRetirada } from '../servicos/api';

// A consulta ocorre somente quando o dono pede para ver o código.
export default function CodigoRetirada({ avisoId, compacto = false }) {
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
      {!compacto && <strong>Retirada no balcão</strong>}
      {codigo && <code className="codigo-retirada">{codigo}</code>}
      {(!compacto || codigo) && <p>Apresente o código de seis dígitos à equipe no momento da retirada.</p>}
      <button type="button" className="botao-secundario" disabled={carregando}
        onClick={codigo ? () => setCodigo('') : mostrar}>
        {codigo ? 'Ocultar código' : carregando ? 'Consultando...' : 'Ver código'}
      </button>
      {erro && <p className="mensagem erro" role="alert">{erro}</p>}
    </div>
  );
}
