import { useEffect, useState } from 'react';
import { buscarCorrespondencias, registrarAchadosDaTriagem } from '../../../servicos/api';

// Cada busca compara o achado com as perdas abertas sem alterar os avisos.
export default function Triagem({ aviso, aoRegistrar }) {
  const [texto, setTexto] = useState('');
  const [consulta, setConsulta] = useState({ texto: '' });
  const [candidatos, setCandidatos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [erroRegistro, setErroRegistro] = useState('');
  const [selecionados, setSelecionados] = useState([]);
  const [registrando, setRegistrando] = useState(false);

  useEffect(() => {
    let ativa = true;
    setCarregando(true);
    setErro('');
    setErroRegistro('');
    setSelecionados([]);
    buscarCorrespondencias(aviso.id, consulta.texto)
      .then((resultado) => { if (ativa) setCandidatos(resultado); })
      .catch((falha) => { if (ativa) setErro(falha.message); })
      .finally(() => { if (ativa) setCarregando(false); });
    return () => { ativa = false; };
  }, [aviso.id, consulta]);

  async function registrar(ids) {
    if (ids.length > 1 && !window.confirm(
      'Confirme que há um objeto físico distinto para cada um dos ' + ids.length + ' avisos selecionados.'
    )) return;
    setErroRegistro('');
    setRegistrando(true);
    try {
      aoRegistrar(aviso.id, await registrarAchadosDaTriagem(aviso.id, ids));
    } catch (falha) {
      setErroRegistro(falha.message);
    } finally {
      setRegistrando(false);
    }
  }

  return (
    <div className="painel-retirada">
      <strong>Possíveis avisos de perda</strong>
      <p>Confira os detalhes de cada aviso. Se houver vários objetos semelhantes em mãos, selecione um aviso para cada objeto.</p>
      <form className="formulario" onSubmit={(evento) => {
        evento.preventDefault();
        setConsulta({ texto: texto.trim() });
      }}>
        <label>
          Palavras para refinar a busca
          <input value={texto} maxLength={200} onChange={(evento) => setTexto(evento.target.value)}
            placeholder="Em branco, busca pela descrição do achado" />
        </label>
        <button type="submit" disabled={carregando || registrando}>Buscar avisos</button>
      </form>
      {carregando && <p role="status">Comparando avisos em aberto...</p>}
      {erro && <p className="mensagem erro" role="alert">{erro}</p>}
      {erroRegistro && <p className="mensagem erro" role="alert">{erroRegistro}</p>}
      {!carregando && !erro && (
        <div>
          <p role="status">{candidatos.length === 0
            ? 'Nenhuma correspondência encontrada. Tente palavras como tipo, cor ou marca.'
            : candidatos.length + ' aviso(s) com termos em comum.'}</p>
          {candidatos.length > 0 && (
            <>
            <ul className="lista-avisos">
              {candidatos.map((candidato) => (
                <li key={candidato.id}>
                  <span className="aviso-numero">Aviso #{candidato.id} · Visitante #{candidato.visitante_id}</span>
                  <strong>{candidato.descricao}</strong>
                  <span className="aviso-metadados">{candidato.pavilhao} · Noite {candidato.noite}</span>
                  <small>Em comum: {candidato.termos_em_comum.join(', ')}</small>
                  <label className="triagem-selecao">
                    <input type="checkbox" checked={selecionados.includes(candidato.id)} disabled={registrando}
                      onChange={(evento) => {
                        const marcado = evento.target.checked;
                        setSelecionados((atuais) => marcado
                          ? [...atuais, candidato.id]
                          : atuais.filter((id) => id !== candidato.id));
                      }} />
                    Selecionar aviso #{candidato.id}
                  </label>
                  <button type="button" disabled={registrando || selecionados.length > 0}
                    onClick={() => registrar([candidato.id])}>Registrar como encontrado</button>
                </li>
              ))}
            </ul>
            <button type="button" disabled={registrando || selecionados.length === 0}
              onClick={() => registrar(selecionados)}>
              {registrando ? 'Registrando...' : 'Registrar selecionados (' + selecionados.length + ')'}
            </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
