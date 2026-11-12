import { useEffect, useState } from 'react';
import { buscarAviso, criarOcorrencia, listarAvisos } from '../../../servicos/api';
import Paginacao from '../../../componentes/Paginacao';
import Situacao, { situacaoDoAviso } from '../../../componentes/Situacao';
import EtiquetaObjeto from '../../../componentes/EtiquetaObjeto';
import VincularDono from './VincularDono';
import ConferirRetirada from './ConferirRetirada';

// A tela de ocorrência registra um achado ou uma devolução em um aviso específico da equipe.
function Ocorrencia({ avisoInicial }) {
  const [pagina, setPagina] = useState(1);
  const [avisoId, setAvisoId] = useState('');
  const [tipo, setTipo] = useState('objeto achado');
  const [descricao, setDescricao] = useState('');
  const [codigoRetirada, setCodigoRetirada] = useState('');
  const [avisos, setAvisos] = useState([]);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [historico, setHistorico] = useState([]);
  const [erroHistorico, setErroHistorico] = useState('');

  function atualizarAviso(atualizado) {
    setAvisos((atuais) => atuais.map((aviso) => aviso.id === atualizado.id ? atualizado : aviso));
    setCodigoRetirada('');
  }

  // O formulário precisa dos avisos existentes para permitir escolher o registro correto.
  useEffect(() => {
    setCarregando(true);
    setAvisoId('');
    setCodigoRetirada('');
    setErro(false);
    setMensagem('');
    listarAvisos({ pagina })
      .then(async (resultado) => {
        const abrir = pagina === 1 && avisoInicial;
        if (abrir && !resultado.some((aviso) => aviso.id === avisoInicial)) {
          const extra = await buscarAviso(avisoInicial);
          resultado = [extra, ...resultado];
        }
        setAvisos(resultado);
        const avisoAberto = resultado.find((aviso) => !['devolvido', 'triado', 'cancelado'].includes(aviso.situacao));
        const primeiroAviso = avisoAberto || resultado[0];
        if (abrir || primeiroAviso) setAvisoId(String(abrir || primeiroAviso.id));
      })
      .catch((falha) => {
        setErro(true);
        setMensagem(falha.message);
      })
      .finally(() => setCarregando(false));
  }, [pagina, avisoInicial]);

  // O envio registra a ocorrência e recarrega a lista para exibir a situação atualizada.
  const enviarOcorrencia = (evento) => {
    evento.preventDefault();
    setMensagem('');
    setErro(false);
    setEnviando(true);

    criarOcorrencia(Number(avisoId), {
      tipo,
      descricao,
      codigo_retirada: tipo === 'devolucao' ? codigoRetirada : undefined,
    })
      .then((resultado) => {
        setMensagem(`Ocorrência registrada com sucesso. Código ${resultado.id}.`);
        setDescricao('');
        setCodigoRetirada('');
        return buscarAviso(Number(avisoId))
          .then(atualizarAviso)
          .catch((falhaAtualizacao) => {
            setErro(true);
            setMensagem(`Ocorrência registrada, mas a lista não pôde ser atualizada: ${falhaAtualizacao.message}`);
          });
      })
      .catch((falha) => {
        setErro(true);
        setMensagem(falha.message);
      })
      .finally(() => setEnviando(false));
  };

  // O status do aviso selecionado confirma à equipe o resultado da regra do serviço.
  const avisoSelecionado = avisos.find((aviso) => String(aviso.id) === avisoId);
  const devolucao = tipo === 'devolucao';
  const podeDevolver = avisoSelecionado?.situacao === 'aguardando retirada'
    && avisoSelecionado.retirada_aprovada;

  useEffect(() => {
    let ativa = true;
    setHistorico([]);
    setErroHistorico('');
    if (avisoId) {
      buscarAviso(avisoId)
        .then((aviso) => { if (ativa) setHistorico(aviso.ocorrencias); })
        .catch((falha) => { if (ativa) setErroHistorico(falha.message); });
    }
    return () => { ativa = false; };
  }, [avisoId, avisoSelecionado]);

  if (carregando) {
    return <section className="cartao"><p>Carregando avisos para ocorrência...</p></section>;
  }

  return (
    <section className="cartao">
      <h3>A ocorrência</h3>
      <p className="texto-apoio">Um objeto encontrado ou uma devolução: registre o próximo passo deste aviso.</p>

      {avisos.length === 0 ? (
        <p>Nenhum aviso disponível para registrar ocorrência.</p>
      ) : (
        <form onSubmit={enviarOcorrencia} className="formulario">
          <label>
            Aviso
            <select required value={avisoId} disabled={enviando} onChange={(evento) => {
              setAvisoId(evento.target.value);
              setCodigoRetirada('');
            }}>
              {avisos.map((aviso) => (
                <option key={aviso.id} value={aviso.id}>Aviso {aviso.id} · {aviso.descricao}</option>
              ))}
            </select>
          </label>
          {avisoSelecionado && (
            <div className="situacao-atual">
              <span>Situação atual</span>
              <Situacao valor={situacaoDoAviso(avisoSelecionado)} />
              {avisoSelecionado.visitante_id != null && <small>Visitante #{avisoSelecionado.visitante_id}</small>}
              {avisoSelecionado.local_guarda && <small>Local de guarda · {avisoSelecionado.local_guarda} · Etiqueta #{avisoSelecionado.id}</small>}
              {avisoSelecionado.recebido_por && <small>Recebido por {avisoSelecionado.recebido_por}</small>}
            </div>
          )}
          {avisoSelecionado?.situacao === 'aguardando retirada' && (
            <EtiquetaObjeto key={avisoSelecionado.id} aviso={avisoSelecionado} />
          )}
          {avisoSelecionado?.situacao === 'aguardando retirada' && avisoSelecionado.visitante_id == null && (
            <VincularDono key={avisoSelecionado.id} avisoId={avisoSelecionado.id}
              aoVincular={atualizarAviso} />
          )}
          {avisoSelecionado?.situacao === 'aguardando retirada' && avisoSelecionado.visitante_id != null && (
            <ConferirRetirada key={avisoSelecionado.id} aviso={avisoSelecionado} aoAtualizar={atualizarAviso} />
          )}

          <label>
            Tipo
            <select value={tipo} disabled={enviando} onChange={(evento) => {
              setTipo(evento.target.value);
              setCodigoRetirada('');
            }}>
              <option value="objeto achado">Objeto achado</option>
              <option value="devolucao">Devolução</option>
            </select>
          </label>

          <div className="tipo-ocorrencia"><span>Você está registrando</span><Situacao valor={tipo} /></div>
          {devolucao && (podeDevolver ? (
            <label>
              Código de retirada do visitante
              <input required maxLength={32} value={codigoRetirada} autoComplete="off"
                spellCheck={false} placeholder="Ex.: 1234-ABCD-5678-EF90"
                onChange={(evento) => setCodigoRetirada(evento.target.value)} />
              <small>Peça ao visitante para abrir Meus avisos e mostrar o código deste objeto.</small>
            </label>
          ) : (
            <p className="texto-apoio">A retirada precisa ser aprovada antes da devolução.</p>
          ))}

          <label>
            Descrição da ocorrência
            <textarea
              required
              minLength="3"
              maxLength="200"
              value={descricao}
              onChange={(evento) => setDescricao(evento.target.value)}
              rows="4"
              placeholder="Descreva o objeto encontrado ou a devolução"
            />
          </label>

          <button type="submit" disabled={enviando || (devolucao ? !podeDevolver : avisoSelecionado?.situacao !== 'procurando')}>
            {enviando ? 'Registrando...' : 'Registrar ocorrência'}
          </button>
        </form>
      )}

      <Paginacao pagina={pagina} quantidade={avisos.length} carregando={carregando || enviando} aoMudar={setPagina} />
      {mensagem && <p className={erro ? 'mensagem erro' : 'mensagem sucesso'} role="status">{mensagem}</p>}
      {erroHistorico && <p className="mensagem erro" role="alert">{erroHistorico}</p>}
      {historico.length > 0 && (
        <section aria-label="Histórico do atendimento">
          <h4>Histórico do atendimento</h4>
          <ul className="lista-ocorrencias">
            {historico.map((evento) => (
              <li key={evento.id}>
                <Situacao valor={evento.tipo} />
                <span>{evento.descricao}</span>
                <small>{evento.atendente && evento.atendente + ' · '}
                  {evento.registrada_em ? new Date(evento.registrada_em).toLocaleString('pt-BR') : evento.data}</small>
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}

export default Ocorrencia;
