import { useState } from 'react';
import { aprovarRetirada, corrigirVinculo } from '../../../servicos/api';

export default function ConferirRetirada({ aviso, aoAtualizar }) {
  const [conferido, setConferido] = useState(false);
  const [detalhe, setDetalhe] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');

  async function executar(corrigir) {
    if (corrigir && !window.confirm('Desfazer este vínculo e invalidar o código de retirada?')) return;
    setOcupado(true);
    setErro('');
    try {
      const resultado = corrigir
        ? await corrigirVinculo(aviso.id)
        : await aprovarRetirada(aviso.id, { conferido, detalhe_informado: detalhe });
      setDetalhe('');
      setConferido(false);
      aoAtualizar(resultado);
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="painel-retirada">
      <strong>{aviso.retirada_aprovada ? 'Retirada aprovada' : 'Conferir propriedade'}</strong>
      {!aviso.retirada_aprovada && (
        <>
          {aviso.tem_detalhe_privado ? (
            <label>Detalhe privado informado pela pessoa
              <input value={detalhe} maxLength={200} autoComplete="off" disabled={ocupado}
                onChange={(evento) => setDetalhe(evento.target.value)} />
              <small>Peça que a pessoa informe o detalhe cadastrado no aviso.</small>
            </label>
          ) : <p>Confira detalhes distintivos ou outro comprovante de propriedade apresentado pela pessoa.</p>}
          <label className="triagem-selecao">
            <input type="checkbox" checked={conferido} disabled={ocupado}
              onChange={(evento) => setConferido(evento.target.checked)} />
            Conferi a propriedade deste objeto
          </label>
          <button type="button" disabled={ocupado || !conferido || (aviso.tem_detalhe_privado && !detalhe.trim())}
            onClick={() => executar(false)}>Aprovar retirada</button>
        </>
      )}
      <button type="button" className="botao-secundario" disabled={ocupado}
        onClick={() => executar(true)}>Corrigir vínculo</button>
      {erro && <p className="mensagem erro" role="alert">{erro}</p>}
    </div>
  );
}
