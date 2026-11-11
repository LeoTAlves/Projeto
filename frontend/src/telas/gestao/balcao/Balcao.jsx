import { useEffect, useState } from 'react';
import { listarAvisos } from '../../../servicos/api';
import Paginacao from '../../../componentes/Paginacao';
import Situacao, { LegendaSituacoes } from '../../../componentes/Situacao';
import Triagem from './Triagem';

// A tela do balcão filtra avisos por pavilhão e mostra o histórico rápido para a equipe.
function Balcao() {
  const [pavilhao, setPavilhao] = useState('');
  const [pagina, setPagina] = useState(1);
  const [avisos, setAvisos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [triagemId, setTriagemId] = useState(null);
  const [mensagemTriagem, setMensagemTriagem] = useState('');

  function atualizarTriagem(achadoId, registrados) {
    const atualizados = new Map(registrados.map((aviso) => [aviso.id, aviso]));
    setAvisos((atuais) => atuais.map((aviso) => aviso.id === achadoId
      ? { ...aviso, situacao: 'triado' }
      : atualizados.get(aviso.id) || aviso));
    setTriagemId(null);
    setMensagemTriagem('Achado registrado nos avisos ' + registrados.map((aviso) => '#' + aviso.id).join(', ') + '.');
  }

  useEffect(() => {
    setCarregando(true);
    setErro('');
    listarAvisos({ pavilhao, pagina })
      .then((resultado) => setAvisos(resultado))
      .catch((erroBusca) => setErro(erroBusca.message))
      .finally(() => setCarregando(false));
  }, [pavilhao, pagina]);

  return (
    <section className="cartao">
      <h3>O balcão</h3>
      <p className="texto-apoio">Um lugar para acompanhar cada aviso e o próximo reencontro.</p>
      <LegendaSituacoes />
      {mensagemTriagem && <p className="mensagem sucesso" role="status">{mensagemTriagem}</p>}
      <label className="filtro-pavilhao">
        Filtrar por pavilhão
        <select value={pavilhao} onChange={(evento) => { setPavilhao(evento.target.value); setPagina(1); }}>
          <option value="">Todos os pavilhões</option>
          <option value="Pavilhao 1">Pavilhão 1</option>
          <option value="Pavilhao 2">Pavilhão 2</option>
          <option value="Pavilhao 3">Pavilhão 3</option>
        </select>
      </label>

      {carregando ? (
        <p>Carregando avisos do balcão...</p>
      ) : erro ? (
        <p className="erro">{erro}</p>
      ) : (
        avisos.length === 0 ? (
          <p>Nenhum aviso encontrado para esse filtro.</p>
        ) : (
          <ul className="lista-avisos lista-balcao">
            {avisos.map((aviso) => (
              <li key={aviso.id}>
                <div className="aviso-topo"><span className="aviso-numero">Aviso #{aviso.id}</span><Situacao valor={aviso.situacao} /></div>
                <strong>{aviso.descricao}</strong>
                <span className="aviso-metadados">{aviso.pavilhao} · Noite {aviso.noite} · {aviso.visitante_id == null ? 'Sem visitante vinculado' : 'Visitante ' + aviso.visitante_id}</span>
                {aviso.visitante_id == null && aviso.situacao === 'aguardando retirada' && (
                  <>
                    <button type="button" className="botao-secundario" aria-expanded={triagemId === aviso.id}
                      onClick={() => setTriagemId(triagemId === aviso.id ? null : aviso.id)}>
                      {triagemId === aviso.id ? 'Fechar triagem' : 'Triar objeto'}
                    </button>
                    {triagemId === aviso.id && <Triagem key={aviso.id} aviso={aviso} aoRegistrar={atualizarTriagem} />}
                  </>
                )}
              </li>
            ))}
          </ul>
        )
      )}
      <Paginacao pagina={pagina} quantidade={avisos.length} carregando={carregando} aoMudar={setPagina} />
    </section>
  );
}

export default Balcao;
