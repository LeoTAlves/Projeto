import { useState } from 'react';
import { atualizarLocalGuarda } from '../../../servicos/api';

// O endereço fica ao lado da etiqueta e pode ser editado sem interromper a triagem.
export default function LocalGuarda({ aviso, aoAtualizar }) {
  const [editando, setEditando] = useState(false);
  const [local, setLocal] = useState(aviso.local_guarda || '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  // Mantém o texto digitado se o balcão precisar tentar novamente.
  async function salvar(evento) {
    evento.preventDefault();
    if (salvando) return;
    setSalvando(true);
    setErro('');
    try {
      aoAtualizar(await atualizarLocalGuarda(aviso.id, local.trim()));
      setEditando(false);
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="painel-retirada">
      <strong>Guarda do objeto · Etiqueta #{aviso.id}</strong>
      <p>{aviso.local_guarda || 'Local ainda não informado'}</p>
      {editando ? (
        <form className="formulario" onSubmit={salvar}>
          <label>Local de guarda
            <input value={local} maxLength={100} placeholder="Ex. Armário B · Caixa 03"
              disabled={salvando} onChange={(evento) => setLocal(evento.target.value)} />
          </label>
          <button type="submit" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar local'}</button>
          <button type="button" className="botao-secundario" disabled={salvando}
            onClick={() => { setEditando(false); setErro(''); }}>Cancelar edição</button>
        </form>
      ) : (
        <button type="button" className="botao-secundario" onClick={() => {
          setLocal(aviso.local_guarda || '');
          setEditando(true);
        }}>{aviso.local_guarda ? 'Editar local de guarda' : 'Informar local de guarda'}</button>
      )}
      {erro && <p className="mensagem erro" role="alert">{erro}</p>}
    </div>
  );
}
