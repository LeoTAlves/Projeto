import { useEffect, useState } from 'react';
import { buscarUsuarioAtual, criarConta, limparSessao, login, salvarToken } from './servicos/api';
import RegistrarPerda from './telas/pessoa/registrar-perda/RegistrarPerda';
import MeusAvisos from './telas/pessoa/meus-avisos/MeusAvisos';
import Balcao from './telas/gestao/balcao/Balcao';
import Ocorrencia from './telas/gestao/ocorrencia/Ocorrencia';

// O login identifica o usuário pelo token e escolhe a tela conforme o grupo retornado.
function App() {
  const [usuario, setUsuario] = useState(null);
  const [tela, setTela] = useState('registrar');
  const [nomeCadastro, setNomeCadastro] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erroLogin, setErroLogin] = useState('');
  const [mensagemCadastro, setMensagemCadastro] = useState('');
  const [modoCadastro, setModoCadastro] = useState(false);
  const [carregandoSessao, setCarregandoSessao] = useState(true);
  const [carregandoLogin, setCarregandoLogin] = useState(false);
  const [carregandoCadastro, setCarregandoCadastro] = useState(false);

  const carregarUsuario = async () => {
    setCarregandoSessao(true);
    setErroLogin('');

    try {
      const usuarioAtual = await buscarUsuarioAtual();
      setUsuario(usuarioAtual);
      setTela(usuarioAtual.tipo === 'visitante' ? 'registrar' : 'balcao');
    } catch (erro) {
      limparSessao();
      setUsuario(null);
    } finally {
      setCarregandoSessao(false);
    }
  };

  useEffect(() => {
    carregarUsuario();
  }, []);

  const entrar = async (evento) => {
    evento.preventDefault();
    setErroLogin('');
    setMensagemCadastro('');
    setCarregandoLogin(true);

    try {
      const resultado = await login({ email, senha });
      salvarToken(resultado.access_token);
      const usuarioAtual = await buscarUsuarioAtual();
      setUsuario(usuarioAtual);
      setTela(usuarioAtual.tipo === 'visitante' ? 'registrar' : 'balcao');
      setEmail('');
      setSenha('');
    } catch (erro) {
      limparSessao();
      setUsuario(null);
      setErroLogin(erro.message || 'Não foi possível entrar com essas credenciais.');
    } finally {
      setCarregandoLogin(false);
    }
  };

  const cadastrar = async (evento) => {
    evento.preventDefault();
    setErroLogin('');
    setMensagemCadastro('');

    if (senha !== confirmarSenha) {
      setErroLogin('As senhas não coincidem.');
      return;
    }

    setCarregandoCadastro(true);
    try {
      await criarConta({ nome: nomeCadastro, email, senha });
      setModoCadastro(false);
      setNomeCadastro('');
      setSenha('');
      setConfirmarSenha('');
      setMensagemCadastro('Conta criada! Entre com seu e-mail e senha.');
    } catch (erro) {
      setErroLogin(erro.message || 'Não foi possível criar sua conta.');
    } finally {
      setCarregandoCadastro(false);
    }
  };

  const alternarModo = () => {
    setModoCadastro((atual) => !atual);
    setErroLogin('');
    setMensagemCadastro('');
    setSenha('');
    setConfirmarSenha('');
  };

  const sair = () => {
    limparSessao();
    setUsuario(null);
    setTela('registrar');
    setEmail('');
    setSenha('');
    setErroLogin('');
  };

  if (carregandoSessao) {
    return (
      <div className="pagina-selecao">
        <div className="card">
          <h1>Cadê, achados e perdidos</h1>
          <p>Validando a sessão...</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="pagina-selecao">
        <div className="card">
          <h1>Cadê, achados e perdidos</h1>
          <p>{modoCadastro ? 'Crie sua conta de visitante para acessar o sistema.' : 'Entre com e-mail e senha para acessar o sistema.'}</p>

          <form onSubmit={modoCadastro ? cadastrar : entrar} className="formulario">
            {modoCadastro && (
              <label>
                Nome
                <input
                  required
                  minLength={3}
                  maxLength={100}
                  value={nomeCadastro}
                  onChange={(evento) => setNomeCadastro(evento.target.value)}
                  placeholder="Seu nome"
                  autoComplete="name"
                />
              </label>
            )}

            <label>
              E-mail
              <input
                required
                type="email"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                placeholder="nome@email.com"
                autoComplete="email"
              />
            </label>

            <label>
              Senha
              <input
                required
                type="password"
                minLength={modoCadastro ? 8 : undefined}
                value={senha}
                onChange={(evento) => setSenha(evento.target.value)}
                placeholder="Sua senha"
                autoComplete={modoCadastro ? 'new-password' : 'current-password'}
              />
            </label>

            {modoCadastro && (
              <label>
                Confirmar senha
                <input
                  required
                  type="password"
                  minLength={8}
                  value={confirmarSenha}
                  onChange={(evento) => setConfirmarSenha(evento.target.value)}
                  placeholder="Digite a senha novamente"
                  autoComplete="new-password"
                />
              </label>
            )}

            <button type="submit" disabled={carregandoLogin || carregandoCadastro}>
              {modoCadastro
                ? (carregandoCadastro ? 'Criando conta...' : 'Criar conta')
                : (carregandoLogin ? 'Entrando...' : 'Entrar')}
            </button>
          </form>

          {mensagemCadastro && <p className="mensagem sucesso" role="status">{mensagemCadastro}</p>}
          {erroLogin && <p className="mensagem erro" role="alert">{erroLogin}</p>}
          <button
            type="button"
            className="botao-link"
            onClick={alternarModo}
            disabled={carregandoLogin || carregandoCadastro}
          >
            {modoCadastro ? 'Já tem uma conta? Entrar' : 'Não tem uma conta? Criar conta'}
          </button>
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

  const telasAtuais = usuario.tipo === 'visitante' ? telasVisitante : telasEquipe;

  return (
    <div className="app-shell">
      <header className="cabecalho">
        <div>
          <p className="titulo-pequeno">Cartilha 5</p>
          <h2>{usuario.tipo === 'visitante' ? 'Perfil da visitante' : 'Perfil da gestão'}</h2>
          <p>{usuario.nome}</p>
        </div>
        <button className="botao-secundario" onClick={sair}>
          Sair
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
        {usuario.tipo === 'visitante' && tela === 'registrar' && <RegistrarPerda visitanteId={usuario.id} />}
        {usuario.tipo === 'visitante' && tela === 'meus' && <MeusAvisos visitanteId={usuario.id} />}
        {usuario.tipo === 'equipe' && tela === 'balcao' && <Balcao />}
        {usuario.tipo === 'equipe' && tela === 'ocorrencia' && <Ocorrencia />}
      </main>
    </div>
  );
}

export default App;
