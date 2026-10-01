import { useState } from 'react';
import RegistrarPerda from './telas/pessoa/registrar-perda/RegistrarPerda';
import MeusAvisos from './telas/pessoa/meus-avisos/MeusAvisos';
import Balcao from './telas/gestao/balcao/Balcao';
import Ocorrencia from './telas/gestao/ocorrencia/Ocorrencia';

// A seleção inicial separa os caminhos do visitante e da equipe sem exigir login.
function App() {
  const [perfil, setPerfil] = useState('');
  const [tela, setTela] = useState('registrar');

  if (!perfil) {
    return (
      <div className="pagina-selecao">
        <div className="card">
          <h1>Cadê, achados e perdidos</h1>
          <p>Escolha o perfil para entrar no sistema.</p>
          <div className="botoes-perfil">
            <button onClick={() => { setPerfil('visitante'); setTela('registrar'); }}>Visitante</button>
            <button onClick={() => { setPerfil('equipe'); setTela('balcao'); }}>Equipe do balcão</button>
          </div>
        </div>
      </div>
    );
  }

  const telasVisitante = [
    { id: 'registrar', nome: 'Registrar perda' },
    { id: 'meus', nome: 'Meus avisos' },
  ];

  const telasEquipe = [
    { id: 'balcao', nome: 'O balcão' },
    { id: 'ocorrencia', nome: 'A ocorrência' },
  ];

  const telasAtuais = perfil === 'visitante' ? telasVisitante : telasEquipe;

  return (
    <div className="app-shell">
      <header className="cabecalho">
        <div>
          <p className="titulo-pequeno">Cartilha 5</p>
          <h2>{perfil === 'visitante' ? 'Perfil da visitante' : 'Perfil da gestão'}</h2>
        </div>
        <button className="botao-secundario" onClick={() => { setPerfil(''); setTela('registrar'); }}>
          Trocar perfil
        </button>
      </header>

      <nav className="navegacao">
        {telasAtuais.map((item) => (
          <button
            key={item.id}
            className={tela === item.id ? 'ativo' : ''}
            onClick={() => setTela(item.id)}
          >
            {item.nome}
          </button>
        ))}
      </nav>

      <main className="conteudo-principal">
        {perfil === 'visitante' && tela === 'registrar' && <RegistrarPerda visitanteId={1} />}
        {perfil === 'visitante' && tela === 'meus' && <MeusAvisos visitanteId={1} />}
        {perfil === 'equipe' && tela === 'balcao' && <Balcao />}
        {perfil === 'equipe' && tela === 'ocorrencia' && <Ocorrencia />}
      </main>
    </div>
  );
}

export default App;
