import { useEffect, useState } from 'react';
import { buscarAviso, buscarCorrespondencias, registrarAchadosDaTriagem, sugerirAtributos, sugerirCorrespondencias } from '../../../servicos/api';

const campos = [
  ['Descrição', 'descricao'], ['Categoria', 'categoria'], ['Cor', 'cor'],
  ['Marca', 'marca'], ['Modelo', 'modelo'], ['Pavilhão', 'pavilhao'],
  ['Turno', 'turno'], ['Noite', 'noite'],
];

const rotulosCaracteristicas = {
  categoria: 'categoria',
  cor: 'cor',
  marca: 'marca',
  modelo: 'modelo',
  caracteristicas_distintivas: 'características distintivas',
};

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
  // Modelo e turno existem apenas na consulta; o formulário não os envia à rota de gravação.
  const [modelo, setModelo] = useState('');
  const [turno, setTurno] = useState('');

  // A consulta envia os dados transitórios e mantém a seleção humana antes de registrar qualquer achado.
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
        modelo: modelo.trim() || null,
        turno: turno || null,
      });
      const sugestoes = resultado.correspondencias.filter((item) => !item.bloqueado).slice(0, 10);
      const detalhes = await Promise.all(sugestoes.map(async (item) => {
        const perda = await buscarAviso(item.aviso_id);
        return {
          ...perda,
          pontuacao: item.pontuacao,
          caracteristicas_compativeis: item.caracteristicas_compativeis,
          explicacao: item.explicacao,
        };
      }));
      const abertas = detalhes.filter((item) => item.situacao === 'procurando');
      if (abertas.length) setSugestoesIA(abertas);
      setMensagemIA(abertas.length ? 'Sugestões da IA para conferência humana.'
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
    const confirmacao = ids.length > 1
      ? 'Confirme que há um objeto físico distinto para cada um dos ' + ids.length + ' avisos selecionados.'
      : 'Confira a comparação e confirme o aviso escolhido antes de registrar o achado.';
    if (!window.confirm(confirmacao)) return;
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
      <p>Confira as características e a explicação antes de escolher um aviso. A IA não registra ocorrências.</p>
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
        {/* Os campos transitórios fornecem contexto adicional sem alterar o aviso persistido. */}
        <details>
          <summary>Informações adicionais para esta consulta</summary>
          <p>Modelo e turno serão usados somente nesta análise e não serão gravados.</p>
          <label>
            Modelo
            <input value={modelo} maxLength={100} disabled={consultandoIA || registrando} onChange={(evento) => {
              setModelo(evento.target.value);
              setSugestoesIA(null);
              setMensagemIA('');
            }} />
          </label>
          <label>
            Turno
            <select value={turno} disabled={consultandoIA || registrando} onChange={(evento) => {
              setTurno(evento.target.value);
              setSugestoesIA(null);
              setMensagemIA('');
            }}>
              <option value="">Não informado</option>
              <option value="manha">Manhã</option>
              <option value="tarde">Tarde</option>
              <option value="noite">Noite</option>
            </select>
          </label>
        </details>
        <button type="submit" disabled={carregando || registrando || consultandoIA}>Buscar por texto</button>
        <button type="button" className="botao-secundario" disabled={carregando || registrando || consultandoIA}
          onClick={buscarComIA}>{consultandoIA ? 'Consultando IA...' : 'Buscar sugestões com IA'}</button>
      </form>
      {mensagemIA && <p role="status">{mensagemIA}</p>}
      {consultandoIA && <p role="status">A IA está comparando os avisos. Aguarde para conferir as sugestões.</p>}
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
                  <CompararObjetos
                    achado={{ ...aviso, modelo: modelo.trim() || null, turno: turno || null }}
                    perda={candidato}
                  />
                  {candidato.pontuacao !== undefined && (
                    <small>
                      Pontuação indicativa: {candidato.pontuacao}/10 · Características compatíveis:{' '}
                      {candidato.caracteristicas_compativeis
                        .map((nome) => rotulosCaracteristicas[nome] || nome).join(', ')}
                    </small>
                  )}
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
                    Conferir e selecionar aviso #{candidato.id}
                  </label>
                </li>
              ))}
            </ul>
            {selecionados.length > 0 && (
              <button className="acao-triagem-lote" type="button" disabled={registrando}
                onClick={() => registrar(selecionados)}>
                {registrando ? 'Registrando...' : selecionados.length === 1
                  ? 'Confirmar aviso e registrar achado'
                  : 'Confirmar avisos selecionados (' + selecionados.length + ')'}
              </button>
            )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
