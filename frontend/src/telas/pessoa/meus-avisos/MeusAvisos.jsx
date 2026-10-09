import { useEffect, useState } from 'react';
import { listarAvisos, buscarAviso } from '../../../servicos/api';
import Paginacao from '../../../componentes/Paginacao';

// A tela de meus avisos combina a lista do visitante com o detalhe de cada aviso e suas ocorrências.
function MeusAvisos({ visitanteId }) {
  const [pagina, setPagina] = useState(1);
  const [avisos, setAvisos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const [erro, setErro] = useState('');
  const [avisoSelecionado, setAvisoSelecionado] = useState(null);

  // A lista e o primeiro detalhe são carregados em sequência para manter os três estados da tela coerentes.
  useEffect(() => {
    setCarregando(true);
    setErro('');
    setAvisos([]);
    setAvisoSelecionado(null);

    listarAvisos({ visitante_id: visitanteId, pagina })
      .then((resultado) => {
        setAvisos(resultado);
        if (resultado.length === 0) return null;
        setCarregandoDetalhe(true);
        return buscarAviso(resultado[0].id);
      })
      .then((detalhe) => {
        if (detalhe) setAvisoSelecionado(detalhe);
      })
      .catch((falha) => setErro(falha.message))
      .finally(() => {
        setCarregando(false);
        setCarregandoDetalhe(false);
      });
  }, [visitanteId, pagina]);

  // O detalhe escolhido inclui o histórico de ocorrências que pertence ao aviso.
  const abrirAviso = (avisoId) => {
    setCarregandoDetalhe(true);
    setErro('');
    buscarAviso(avisoId)
      .then((detalhe) => setAvisoSelecionado(detalhe))
      .catch((falha) => setErro(falha.message))
      .finally(() => setCarregandoDetalhe(false));
  };

  if (carregando) return <section className="cartao"><p>Carregando avisos...</p></section>;
  if (erro) return <section className="cartao"><p className="erro">{erro}</p></section>;

  return (
    <section className="tela-dupla">
      <div className="cartao lista">
        <h3>Meus avisos</h3>
        {avisos.length === 0 ? (
          <p>Nenhum aviso registrado.</p>
        ) : (
          <ul className="lista-avisos">
            {avisos.map((aviso) => (
              <li key={aviso.id} className={avisoSelecionado && avisoSelecionado.id === aviso.id ? 'selecionado' : ''}>
                <button type="button" className="botao-aviso" onClick={() => abrirAviso(aviso.id)}>
                  <strong>{aviso.descricao}</strong>
                  <span>{aviso.pavilhao}</span>
                  <small>{aviso.situacao}</small>
                </button>
              </li>
            ))}
          </ul>
        )}
        <Paginacao pagina={pagina} quantidade={avisos.length} carregando={carregando} aoMudar={setPagina} />
      </div>

      <div className="cartao detalhe">
        {carregandoDetalhe ? (
          <p>Carregando o aviso e suas ocorrências...</p>
        ) : avisoSelecionado ? (
          <>
            <h3>Detalhes do aviso</h3>
            <p><strong>Descrição:</strong> {avisoSelecionado.descricao}</p>
            <p><strong>Pavilhão:</strong> {avisoSelecionado.pavilhao}</p>
            <p><strong>Noite:</strong> {avisoSelecionado.noite}</p>
            <p><strong>Situação:</strong> {avisoSelecionado.situacao}</p>

            <h4>Ocorrências</h4>
            {avisoSelecionado.ocorrencias.length === 0 ? (
              <p>Nenhuma ocorrência registrada ainda.</p>
            ) : (
              <ul className="lista-ocorrencias">
                {avisoSelecionado.ocorrencias.map((ocorrencia) => (
                  <li key={ocorrencia.id}>
                    <strong>{ocorrencia.tipo}</strong>
                    <span>{ocorrencia.descricao}</span>
                    <small>{ocorrencia.data}</small>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p>Escolha um aviso para visualizar as ocorrências.</p>
        )}
      </div>
    </section>
  );
}

export default MeusAvisos;
