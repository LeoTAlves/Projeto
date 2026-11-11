import { useEffect, useState } from 'react';
import { criarOcorrencia, listarAvisos } from '../../../servicos/api';
import Paginacao from '../../../componentes/Paginacao';
import Situacao from '../../../componentes/Situacao';
import VincularDono from './VincularDono';

// A tela de ocorrência registra um achado ou uma devolução em um aviso específico da equipe.
function Ocorrencia() {
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

  // O formulário precisa dos avisos existentes para permitir escolher o registro correto.
  useEffect(() => {
    setCarregando(true);
    setAvisoId('');
    setCodigoRetirada('');
    setErro(false);
    setMensagem('');
    listarAvisos({ pagina })
      .then((resultado) => {
        setAvisos(resultado);
        const avisoAberto = resultado.find((aviso) => !['devolvido', 'triado'].includes(aviso.situacao));
        const primeiroAviso = avisoAberto || resultado[0];
        if (primeiroAviso) setAvisoId(String(primeiroAviso.id));
      })
      .catch((falha) => {
        setErro(true);
        setMensagem(falha.message);
      })
      .finally(() => setCarregando(false));
  }, [pagina]);

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
        return listarAvisos({ pagina })
          .then((avisosAtualizados) => setAvisos(avisosAtualizados))
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
    && avisoSelecionado.visitante_id != null;

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
              <Situacao valor={avisoSelecionado.situacao} />
              {avisoSelecionado.visitante_id != null && <small>Visitante #{avisoSelecionado.visitante_id}</small>}
            </div>
          )}
          {avisoSelecionado?.situacao === 'aguardando retirada' && avisoSelecionado.visitante_id == null && (
            <VincularDono key={avisoSelecionado.id} avisoId={avisoSelecionado.id}
              aoVincular={(atualizado) => setAvisos((atuais) => atuais.map(
                (aviso) => aviso.id === atualizado.id ? atualizado : aviso
              ))} />
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
            <p className="texto-apoio">Para devolver, o objeto deve estar aguardando retirada e vinculado ao visitante.</p>
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

          <button type="submit" disabled={enviando || !avisoId || ['devolvido', 'triado'].includes(avisoSelecionado?.situacao) || (devolucao && !podeDevolver)}>
            {enviando ? 'Registrando...' : 'Registrar ocorrência'}
          </button>
        </form>
      )}

      <Paginacao pagina={pagina} quantidade={avisos.length} carregando={carregando || enviando} aoMudar={setPagina} />
      {mensagem && <p className={erro ? 'mensagem erro' : 'mensagem sucesso'} role="status">{mensagem}</p>}
    </section>
  );
}

export default Ocorrencia;
