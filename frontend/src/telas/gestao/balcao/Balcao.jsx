import { useEffect, useState } from 'react';
import { listarAvisos } from '../../../servicos/api';
import Paginacao from '../../../componentes/Paginacao';

// A tela do balcão filtra avisos por pavilhão e mostra o histórico rápido para a equipe.
function Balcao() {
  const [pavilhao, setPavilhao] = useState('');
  const [pagina, setPagina] = useState(1);
  const [avisos, setAvisos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

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
      <label>
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
                <strong>{aviso.descricao}</strong>
                <span>{aviso.pavilhao} · Noite {aviso.noite} · Visitante {aviso.visitante_id}</span>
                <small>{aviso.situacao}</small>
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
