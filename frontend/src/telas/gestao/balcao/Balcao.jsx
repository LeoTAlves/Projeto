import { useEffect, useState } from 'react';
import { listarAvisos } from '../../../servicos/api';
import Paginacao from '../../../componentes/Paginacao';
import Situacao from '../../../componentes/Situacao';
import Ocorrencia from '../ocorrencia/Ocorrencia';

const filas = [
  ['', 'Todos os avisos'],
  ['triagem', 'Para triar'],
  ['retirada', 'Prontos para retirada'],
];

// O cartão indica a próxima tarefa para que a equipe escolha o aviso em um clique.
function acaoDoAviso(aviso) {
  if (aviso.situacao === 'procurando') return 'Registrar achado';
  if (aviso.situacao !== 'aguardando retirada') return 'Ver atendimento';
  if (aviso.visitante_id == null) return 'Triar objeto';
  return 'Entregar objeto';
}

// A fila conserva seus filtros e sua página quando a pessoa abre e fecha um aviso.
export default function Balcao({ avisoInicial }) {
  const [pavilhao, setPavilhao] = useState('');
  const [pagina, setPagina] = useState(1);
  const [avisos, setAvisos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [avisoId, setAvisoId] = useState(avisoInicial || null);
  const [numero, setNumero] = useState('');
  const [pendencia, setPendencia] = useState('');
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    if (avisoId) return;
    let ativa = true;
    setCarregando(true);
    setErro('');
    listarAvisos({ pavilhao, pagina, pendencia })
      .then((resultado) => { if (ativa) setAvisos(resultado); })
      .catch((falha) => { if (ativa) setErro(falha.message); })
      .finally(() => { if (ativa) setCarregando(false); });
    return () => { ativa = false; };
  }, [pavilhao, pagina, pendencia, avisoId, tentativa]);

  if (avisoId) {
    return <Ocorrencia key={avisoId} avisoId={avisoId}
      aoAbrirAviso={setAvisoId} aoVoltar={() => { setCarregando(true); setAvisoId(null); }} />;
  }

  return (
    <section className="cartao">
      <h2 className="titulo-atendimento">Atendimentos</h2>
      <div className="filtros-atendimento">
        <form className="busca-aviso" onSubmit={(evento) => {
          evento.preventDefault();
          const id = Number(numero);
          if (Number.isSafeInteger(id) && id > 0) setAvisoId(id);
        }}>
          <label>
            Número do aviso ou da etiqueta
            <input type="text" inputMode="numeric" required pattern="[0-9]+" maxLength={15}
              placeholder="Ex. 123" value={numero}
              onChange={(evento) => {
                evento.target.setCustomValidity(Number(evento.target.value) === 0 && evento.target.value
                  ? 'Informe um número maior que zero.' : '');
                setNumero(evento.target.value);
              }} />
          </label>
          <button type="submit">Abrir aviso</button>
        </form>
        <label>
          Pavilhão
          <select value={pavilhao} onChange={(evento) => { setPavilhao(evento.target.value); setPagina(1); }}>
            <option value="">Todos os pavilhões</option>
            <option value="Pavilhao 1">Pavilhão 1</option>
            <option value="Pavilhao 2">Pavilhão 2</option>
            <option value="Pavilhao 3">Pavilhão 3</option>
          </select>
        </label>
      </div>
      <div className="navegacao filtros-fila" role="group" aria-label="Filtrar por etapa do atendimento">
        {filas.map(([valor, rotulo]) => (
          <button key={valor} type="button" aria-pressed={pendencia === valor}
            className={pendencia === valor ? 'ativo' : ''}
            onClick={() => { setPendencia(valor); setPagina(1); }}>{rotulo}</button>
        ))}
      </div>

      {carregando ? (
        <p role="status">Carregando atendimentos...</p>
      ) : erro ? (
        <>
          <p className="mensagem erro" role="alert">{erro}</p>
          <button type="button" className="botao-secundario"
            onClick={() => setTentativa((atual) => atual + 1)}>Tentar novamente</button>
        </>
      ) : avisos.length === 0 ? (
        <p>Nenhum aviso para os filtros selecionados.</p>
      ) : (
        <ul className="lista-avisos lista-balcao">
          {avisos.map((aviso) => (
            <li key={aviso.id} data-situacao={aviso.situacao}>
              <div className="aviso-topo">
                <span className="aviso-numero">Aviso #{aviso.id}</span>
                <Situacao valor={aviso.situacao} />
              </div>
              <strong>{aviso.descricao}</strong>
              <span className="aviso-metadados">
                {[aviso.pavilhao, aviso.categoria, aviso.local_guarda].filter(Boolean).join(' · ')}
              </span>
              <button type="button" className="botao-secundario"
                aria-label={acaoDoAviso(aviso) + ' · aviso #' + aviso.id}
                onClick={() => setAvisoId(aviso.id)}>{acaoDoAviso(aviso)}</button>
            </li>
          ))}
        </ul>
      )}
      {!erro && (pagina > 1 || avisos.length >= 10) && (
        <Paginacao pagina={pagina} quantidade={avisos.length} carregando={carregando} aoMudar={setPagina} />
      )}
    </section>
  );
}
