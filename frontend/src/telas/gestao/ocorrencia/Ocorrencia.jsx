import { useEffect, useRef, useState } from 'react';
import { buscarAviso, criarOcorrencia } from '../../../servicos/api';
import Situacao, { situacaoDoAviso } from '../../../componentes/Situacao';
import EtiquetaObjeto from '../../../componentes/EtiquetaObjeto';
import Triagem from '../balcao/Triagem';
import VincularDono from './VincularDono';
import ConferirRetirada from './ConferirRetirada';

// O aviso já vem escolhido da fila. Sua situação determina a ação do atendimento.
export default function Ocorrencia({ avisoId, aoVoltar, aoAbrirAviso }) {
  const [aviso, setAviso] = useState(null);
  const [tentativa, setTentativa] = useState(0);
  const [erro, setErro] = useState('');
  const [erroConsulta, setErroConsulta] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [avisosTriados, setAvisosTriados] = useState([]);
  const titulo = useRef(null);
  const carregado = aviso !== null;

  // Uma consulta pelo número abre o aviso mesmo quando ele está fora da página da fila.
  useEffect(() => {
    let ativa = true;
    buscarAviso(avisoId)
      .then((resultado) => { if (ativa) setAviso(resultado); })
      .catch((falha) => { if (ativa) setErroConsulta(falha.message); });
    return () => { ativa = false; };
  }, [avisoId, tentativa]);

  // Leva o foco ao objeto uma vez, sem interromper o preenchimento dos campos.
  useEffect(() => {
    if (carregado) titulo.current?.focus();
  }, [carregado]);

  // Atualiza a ação imediatamente e recarrega o histórico da operação já gravada.
  function atualizarAviso(atualizado) {
    setAviso((atual) => ({ ...atual, ...atualizado }));
    setErro('');
    setErroConsulta('');
    setTentativa((atual) => atual + 1);
  }

  const devolucao = aviso?.situacao === 'aguardando retirada' && aviso.retirada_aprovada;
  const semVisitante = aviso?.situacao === 'aguardando retirada' && aviso.visitante_id == null;

  // A entrega usa o código informado. O histórico recebe uma descrição padrão se não houver nota.
  async function registrar(evento) {
    evento.preventDefault();
    if (enviando) return;
    const campos = new FormData(evento.currentTarget);
    const descricao = campos.get('descricao')?.trim();
    if (!devolucao && (!descricao || descricao.length < 3)) {
      setErro('Descreva o achado com pelo menos três caracteres.');
      return;
    }
    setEnviando(true);
    setErro('');
    setMensagem('');
    try {
      const ocorrencia = await criarOcorrencia(avisoId, {
        tipo: devolucao ? 'devolucao' : 'objeto achado',
        descricao: descricao || 'Objeto entregue ao visitante.',
        codigo_retirada: devolucao ? campos.get('codigo') : undefined,
      });
      setMensagem(devolucao ? 'Devolução registrada.' : 'Objeto registrado como encontrado.');
      atualizarAviso({
        situacao: devolucao ? 'devolvido' : 'aguardando retirada',
        ocorrencias: [...(aviso.ocorrencias || []), ocorrencia],
      });
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setEnviando(false);
    }
  }

  // Mantém o resultado da triagem na tela e permite abrir cada aviso atualizado.
  function concluirTriagem(id, registrados) {
    setAvisosTriados(registrados);
    atualizarAviso({ situacao: 'triado' });
  }

  return (
    <section className="cartao atendimento">
      <div className="aviso-topo">
        <button type="button" className="botao-secundario" disabled={enviando} onClick={aoVoltar}>
          ← Voltar aos atendimentos
        </button>
        <span className="aviso-numero">Aviso #{avisoId}</span>
      </div>
      {erro && <p className="mensagem erro" role="alert">{erro}</p>}
      {mensagem && <p className="mensagem sucesso" role="status">{mensagem}</p>}
      {erroConsulta && (
        <>
          <p className="mensagem erro" role="alert">{erroConsulta}</p>
          <button type="button" className="botao-secundario" onClick={() => {
            setErroConsulta('');
            setTentativa((atual) => atual + 1);
          }}>Recarregar aviso</button>
        </>
      )}
      {!aviso && !erroConsulta && <p role="status">Carregando aviso...</p>}
      {aviso && (
        <>
          <div className="atendimento-resumo">
            <h2 tabIndex={-1} ref={titulo}>
              {aviso.descricao}
            </h2>
            <Situacao valor={situacaoDoAviso(aviso)} />
            <p className="aviso-metadados">
              {[aviso.categoria, aviso.cor, aviso.marca, aviso.pavilhao,
                aviso.noite && aviso.noite.split('-').reverse().join('/'),
                aviso.visitante_id != null && 'Visitante #' + aviso.visitante_id].filter(Boolean).join(' · ')}
            </p>
            {aviso.local_guarda && <p><strong>Local de guarda</strong> {aviso.local_guarda}</p>}
            {aviso.recebido_por && <small>Recebido por {aviso.recebido_por}</small>}
            {aviso.situacao_desde && (
              <small>Nesta situação desde {new Date(aviso.situacao_desde).toLocaleString('pt-BR')}</small>
            )}
          </div>

          {semVisitante && <Triagem aviso={aviso} aoRegistrar={concluirTriagem} />}
          {avisosTriados.length > 0 && (
            <div className="painel-retirada">
              <strong role="status">Achado registrado. Abra o aviso para conferir a retirada ou imprimir a etiqueta.</strong>
              {avisosTriados.map((registrado) => (
                <button key={registrado.id} type="button" className="botao-secundario"
                  onClick={() => aoAbrirAviso(registrado.id)}>Abrir aviso #{registrado.id}</button>
              ))}
            </div>
          )}
          {aviso.situacao === 'aguardando retirada' && aviso.visitante_id != null && !devolucao && (
            <ConferirRetirada aviso={aviso} aoAtualizar={atualizarAviso} />
          )}
          {(aviso.situacao === 'procurando' || devolucao) && (
            <form key={aviso.situacao} onSubmit={registrar} className="formulario painel-retirada">
              <h3>{devolucao ? 'Entregar objeto' : 'Registrar como encontrado'}</h3>
              {devolucao && (
                <label>
                  Código de retirada
                  <input name="codigo" required maxLength={32} autoComplete="off" spellCheck={false} disabled={enviando} />
                  <small>Peça ao visitante para mostrar o código em Meus avisos.</small>
                </label>
              )}
              {devolucao ? (
                <details>
                  <summary>Adicionar observação</summary>
                  <label>Observação da entrega
                    <textarea name="descricao" minLength={3} maxLength={200} rows={2} disabled={enviando} />
                  </label>
                </details>
              ) : (
                <label>Descrição do achado
                  <textarea name="descricao" required minLength={3} maxLength={200} rows={3} disabled={enviando} />
                </label>
              )}
              <button type="submit" disabled={enviando}>
                {enviando ? 'Registrando...' : devolucao ? 'Confirmar devolução' : 'Confirmar achado'}
              </button>
            </form>
          )}

          {aviso.situacao === 'aguardando retirada' && (
            <details className="opcoes-atendimento">
              <summary>Etiqueta e opções do aviso</summary>
              <EtiquetaObjeto aviso={aviso} />
              {semVisitante && <VincularDono avisoId={aviso.id} aoVincular={atualizarAviso} />}
              {devolucao && <ConferirRetirada aviso={aviso} aoAtualizar={atualizarAviso} />}
            </details>
          )}
          {aviso.ocorrencias?.length > 0 && (
            <details className="opcoes-atendimento">
              <summary>Histórico do atendimento ({aviso.ocorrencias.length})</summary>
              <ul className="lista-ocorrencias">
                {aviso.ocorrencias.map((evento) => (
                  <li key={evento.id}>
                    <Situacao valor={evento.tipo} />
                    <span>{evento.descricao}</span>
                    <small>{evento.atendente && evento.atendente + ' · '}
                      {evento.registrada_em ? new Date(evento.registrada_em).toLocaleString('pt-BR') : evento.data}</small>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </section>
  );
}
