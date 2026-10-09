import { useEffect, useState } from 'react';
import { criarOcorrencia, listarAvisos } from '../../../servicos/api';
import Paginacao from '../../../componentes/Paginacao';

// A tela de ocorrência registra um achado ou uma devolução em um aviso específico da equipe.
function Ocorrencia() {
  const [pagina, setPagina] = useState(1);
  const [avisoId, setAvisoId] = useState('');
  const [tipo, setTipo] = useState('objeto achado');
  const [descricao, setDescricao] = useState('');
  const [avisos, setAvisos] = useState([]);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  // O formulário precisa dos avisos existentes para permitir escolher o registro correto.
  useEffect(() => {
    setCarregando(true);
    setAvisoId('');
    setErro(false);
    setMensagem('');
    listarAvisos({ pagina })
      .then((resultado) => {
        setAvisos(resultado);
        const avisoAberto = resultado.find((aviso) => aviso.situacao !== 'devolvido');
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
    })
      .then((resultado) => {
        setMensagem(`Ocorrência registrada com sucesso. Código ${resultado.id}.`);
        setDescricao('');
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

  if (carregando) {
    return <section className="cartao"><p>Carregando avisos para ocorrência...</p></section>;
  }

  return (
    <section className="cartao">
      <h3>A ocorrência</h3>

      {avisos.length === 0 ? (
        <p>Nenhum aviso disponível para registrar ocorrência.</p>
      ) : (
        <form onSubmit={enviarOcorrencia} className="formulario">
          <label>
            Aviso
            <select required value={avisoId} onChange={(evento) => setAvisoId(evento.target.value)}>
              {avisos.map((aviso) => (
                <option key={aviso.id} value={aviso.id}>Aviso {aviso.id} · {aviso.descricao}</option>
              ))}
            </select>
          </label>
          {avisoSelecionado && <p>Situação atual: <strong>{avisoSelecionado.situacao}</strong></p>}

          <label>
            Tipo
            <select value={tipo} onChange={(evento) => setTipo(evento.target.value)}>
              <option value="objeto achado">Objeto achado</option>
              <option value="devolucao">Devolução</option>
            </select>
          </label>

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

          <button type="submit" disabled={enviando || !avisoId}>
            {enviando ? 'Registrando...' : 'Registrar ocorrência'}
          </button>
        </form>
      )}

      <Paginacao pagina={pagina} quantidade={avisos.length} carregando={carregando || enviando} aoMudar={setPagina} />
      {mensagem && <p className={erro ? 'mensagem erro' : 'mensagem'} role="status">{mensagem}</p>}
    </section>
  );
}

export default Ocorrencia;
