import { useEffect, useState } from 'react';
import { buscarAviso, buscarCorrespondencias, registrarAchadosDaTriagem, sugerirAtributos, sugerirCorrespondencias } from '../../../servicos/api';

const campos = [
  ['Descrição', 'descricao'], ['Categoria', 'categoria'], ['Cor', 'cor'],
  ['Marca', 'marca'], ['Pavilhão', 'pavilhao'], ['Noite', 'noite'],
];

function CompararObjetos({ achado, perda }) {
  return (
    <div className="triagem-comparacao">
      {[[achado, 'Objeto recebido'], [perda, 'Aviso de perda']].map(([objeto, titulo]) => (
        <div key={titulo}>
          <strong>{titulo}</strong>
          <dl>
            {campos.map(([rotulo, chave]) => {
              const valor = objeto[chave];
              const outro = (objeto === achado ? perda : achado)[chave];
              const diverge = chave !== 'descricao' && valor && outro
                && valor.trim().toLowerCase() !== outro.trim().toLowerCase();
              return (
                <div key={chave}>
                  <dt>{rotulo}</dt>
                  <dd>{valor || 'Não informado'}{diverge && <small> · Difere</small>}</dd>
                </div>
              );
            })}
          </dl>
        </div>
      ))}
    </div>
  );
}

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
  const [consultandoIA, setConsultandoIA] = useState(false);
  const [sugestoesIA, setSugestoesIA] = useState(null);
  const [mensagemIA, setMensagemIA] = useState('');

  async function buscarComIA() {
    setConsultandoIA(true);
    setMensagemIA('');
    setSelecionados([]);
    setErroRegistro('');
    setSugestoesIA(null);
    try {
      const preenchidos = [aviso.categoria, aviso.cor, aviso.marca].filter(Boolean);
      const extras = preenchidos.length < 2 ? await sugerirAtributos(aviso.descricao) : {};
      const resultado = await sugerirCorrespondencias({
        categoria: aviso.categoria || extras.categoria,
        cor: aviso.cor || extras.cor,
        marca: aviso.marca || extras.marca,
        caracteristicas_distintivas: aviso.descricao, pavilhao: aviso.pavilhao, noite: aviso.noite,
      });
      const sugestoes = resultado.correspondencias.filter((item) => !item.bloqueado).slice(0, 10);
      const detalhes = await Promise.allSettled(sugestoes.map(async (item) => {
        const perda = await buscarAviso(item.aviso_id);
        return { ...perda, explicacao: item.explicacao };
      }));
      const abertas = detalhes.filter((item) => item.status === 'fulfilled' && item.value.situacao === 'procurando')
        .map((item) => item.value);
      if (abertas.length) setSugestoesIA(abertas);
      setMensagemIA(abertas.length ? (resultado.origem === 'local'
        ? 'Sugestões pela comparação local. O provedor de IA está indisponível.'
        : 'Sugestões da IA para conferência.')
        : sugestoes.length ? 'Os avisos sugeridos não estão mais disponíveis. Confira a busca por texto.'
          : resultado.mensagem);
    } catch (falha) {
      setMensagemIA(falha.message + ' Você pode continuar pela busca por texto.');
    } finally {
      setConsultandoIA(false);
    }
  }

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

  const resultados = sugestoesIA || candidatos;

  return (
    <div className="painel-retirada">
      <strong>Possíveis avisos de perda</strong>
      <p>Compare os avisos abaixo. Para vários objetos físicos, selecione um aviso por objeto.</p>
      <form className="formulario busca-triagem" onSubmit={(evento) => {
        evento.preventDefault();
        setSugestoesIA(null);
        setMensagemIA('');
        setConsulta({ texto: texto.trim() });
      }}>
        <label>
          Palavras para refinar a busca
          <input value={texto} maxLength={200} onChange={(evento) => setTexto(evento.target.value)}
            placeholder="Em branco, busca pela descrição do achado" />
        </label>
        <button type="submit" disabled={carregando || registrando || consultandoIA}>Buscar por texto</button>
        <button type="button" className="botao-secundario" disabled={carregando || registrando || consultandoIA}
          onClick={buscarComIA}>{consultandoIA ? 'Consultando IA...' : 'Buscar sugestões com IA'}</button>
      </form>
      {mensagemIA && <p role="status">{mensagemIA}</p>}
      {carregando && <p role="status">Comparando avisos em aberto...</p>}
      {erro && <p className="mensagem erro" role="alert">{erro}</p>}
      {erroRegistro && <p className="mensagem erro" role="alert">{erroRegistro}</p>}
      {!carregando && !consultandoIA && (!erro || sugestoesIA) && (
        <div>
          <p role="status">{resultados.length === 0
            ? 'Nenhuma correspondência encontrada. Tente palavras como tipo, cor ou marca.'
            : resultados.length + ' aviso(s) para conferência.'}</p>
          {resultados.length > 0 && (
            <>
            <ul className="lista-avisos">
              {resultados.map((candidato) => (
                <li key={candidato.id}>
                  <span className="aviso-numero">Aviso #{candidato.id} · Visitante #{candidato.visitante_id}</span>
                  <CompararObjetos achado={aviso} perda={candidato} />
                  {candidato.termos_em_comum?.length > 0 && <small>Em comum: {candidato.termos_em_comum.join(', ')}</small>}
                  {candidato.explicacao && <small>{candidato.explicacao}</small>}
                  <label className="triagem-selecao">
                    <input type="checkbox" checked={selecionados.includes(candidato.id)}
                      disabled={registrando || (selecionados.length >= 100 && !selecionados.includes(candidato.id))}
                      onChange={(evento) => {
                        const marcado = evento.target.checked;
                        setSelecionados((atuais) => marcado
                          ? [...atuais, candidato.id]
                          : atuais.filter((id) => id !== candidato.id));
                      }} />
                    Selecionar aviso #{candidato.id}
                  </label>
                  {selecionados.length === 0 && (
                    <button type="button" disabled={registrando}
                      onClick={() => registrar([candidato.id])}>Registrar como encontrado</button>
                  )}
                </li>
              ))}
            </ul>
            {selecionados.length > 0 && (
              <button className="acao-triagem-lote" type="button" disabled={registrando}
                onClick={() => registrar(selecionados)}>
                {registrando ? 'Registrando...' : 'Registrar selecionados (' + selecionados.length + ')'}
              </button>
            )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
