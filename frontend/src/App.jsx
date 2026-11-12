import { useEffect, useState } from 'react';
import { buscarUsuarioAtual, confirmarEmail, criarConta, limparSessao, login, salvarToken } from './servicos/api';
import RegistrarPerda from './telas/pessoa/registrar-perda/RegistrarPerda';
import MeusAvisos from './telas/pessoa/meus-avisos/MeusAvisos';
import Balcao from './telas/gestao/balcao/Balcao';
import Ocorrencia from './telas/gestao/ocorrencia/Ocorrencia';
import CadastrarEquipe from './telas/gestao/equipe/CadastrarEquipe';
import Marca from './componentes/Marca';

// O login identifica o usuário pelo token e escolhe a tela conforme o grupo retornado.
function App() {
  const [tema, setTema] = useState(() => {
    const salvo = localStorage.getItem('cade-tema');
    if (salvo === 'claro' || salvo === 'escuro') return salvo;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro';
  });
  const [mostrarSenha, setMostrarSenha] = useState(false);
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
  const [segundoFator, setSegundoFator] = useState(null);
  const [codigoLogin, setCodigoLogin] = useState('');
  const [avisoParaAbrir, setAvisoParaAbrir] = useState(null);

  // O tema acompanha a pessoa na entrada e nas telas autenticadas.
  useEffect(() => {
    document.documentElement.dataset.tema = tema;
    localStorage.setItem('cade-tema', tema);
  }, [tema]);

  const botaoTema = (
    <button type="button" className="botao-secundario botao-tema"
      onClick={() => setTema(tema === 'claro' ? 'escuro' : 'claro')}>
      {tema === 'claro' ? '☾ Tema escuro' : '☀ Tema claro'}
    </button>
  );

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
    const url = new URL(window.location.href);
    const token = url.searchParams.get('confirmar_email');
    if (token) {
      url.searchParams.delete('confirmar_email');
      window.history.replaceState(null, '', url);
      confirmarEmail(token)
        .then(() => setMensagemCadastro('E-mail confirmado. Entre com sua conta.'))
        .catch((falha) => setErroLogin(falha.message));
    }
  }, []);

  const entrar = async (evento, reenviar = false) => {
    evento.preventDefault();
    setErroLogin('');
    setMensagemCadastro('');
    setCarregandoLogin(true);

    try {
      const resultado = await login({
        email, senha, codigo: codigoLogin || undefined, desafio: segundoFator?.desafio,
        reenviar_confirmacao: reenviar,
      });
      if (resultado.etapa) {
        setSegundoFator(resultado);
        if (resultado.etapa === 'email_pendente') {
          setMensagemCadastro(reenviar
            ? 'Confira a caixa de entrada. O reenvio fica disponível a cada minuto.'
            : 'Confirme seu e-mail pelo link enviado no cadastro.');
        }
        return;
      }
      salvarToken(resultado.access_token);
      const usuarioAtual = await buscarUsuarioAtual();
      setUsuario(usuarioAtual);
      setTela(usuarioAtual.tipo === 'visitante' ? 'registrar' : 'balcao');
      setEmail('');
      setSenha('');
      setSegundoFator(null);
      setCodigoLogin('');
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
      setMensagemCadastro('Conta criada. Confirme seu e-mail pelo link que enviamos.');
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
    setMostrarSenha(false);
    setSegundoFator(null);
    setCodigoLogin('');
  };

  const sair = () => {
    limparSessao();
    setUsuario(null);
    setTela('registrar');
    setEmail('');
    setSenha('');
    setErroLogin('');
    setMostrarSenha(false);
    setSegundoFator(null);
    setCodigoLogin('');
  };

  if (carregandoSessao) {
    return (
      <div className="pagina-selecao">
        <div className="card">
          <Marca />
          <p role="status">Preparando seu espaço...</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="pagina-selecao pagina-acesso">
        <aside className="apresentacao">
          <Marca destaque />
          <div className="apresentacao-texto">
            <p className="sobretitulo">Um ponto de encontro para o que se perdeu</p>
            <h1>Perdeu algo?<br />{' '}O reencontro<br />{' '}começa <span>aqui.</span></h1>
            <p>Registre sua perda, acompanhe os avisos e conte com a equipe do balcão para encontrar o caminho de volta.</p>
          </div>
          <div className="apresentacao-rodape">
            <span className="selo-reencontro" aria-hidden="true">↗</span>
            <span>Menos procura.<br /><strong>Mais reencontros.</strong></span>
          </div>
        </aside>
        <div className="card card-acesso">
          <div className="tema-acesso">{botaoTema}</div>
          <p className="sobretitulo">Seu espaço no Cadê!?</p>
          <h2>{modoCadastro ? 'Vamos criar sua conta?' : 'Que bom ter você aqui.'}</h2>
          <p className="texto-apoio">{modoCadastro ? 'Cadastre-se como visitante para registrar e acompanhar suas perdas.' : 'Entre para acompanhar seus avisos ou atender no balcão.'}</p>

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
                onChange={(evento) => { setEmail(evento.target.value); setSegundoFator(null); setCodigoLogin(''); }}
                placeholder="nome@email.com"
                autoComplete="email"
              />
            </label>

            <div className="campo-senha">
              <label htmlFor="senha-acesso">Senha</label>
              <div className="campo-senha-controle">
                <input
                  id="senha-acesso"
                  required
                  type={mostrarSenha ? 'text' : 'password'}
                  minLength={modoCadastro ? 8 : undefined}
                  value={senha}
                  onChange={(evento) => { setSenha(evento.target.value); setSegundoFator(null); setCodigoLogin(''); }}
                  placeholder="Sua senha"
                  autoComplete={modoCadastro ? 'new-password' : 'current-password'}
                />
                <button type="button" className="botao-olho" aria-controls="senha-acesso"
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  onClick={() => setMostrarSenha(!mostrarSenha)}>
                  <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z" />
                    <circle cx="12" cy="12" r="2.5" />
                    {mostrarSenha && <path d="m3 3 18 18" />}
                  </svg>
                </button>
              </div>
            </div>

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

            {!modoCadastro && segundoFator?.etapa === 'email_pendente' && (
              <button type="button" className="botao-secundario" disabled={carregandoLogin}
                onClick={(evento) => entrar(evento, true)}>Reenviar confirmação</button>
            )}
            {!modoCadastro && segundoFator && segundoFator.etapa !== 'email_pendente' && (
              <>
                {segundoFator.etapa === 'configurar_autenticador' && (
                  <div className="painel-retirada">
                    <p>Adicione esta chave ao seu aplicativo autenticador como conta baseada em tempo.</p>
                    <code className="codigo-retirada">{segundoFator.chave_autenticador}</code>
                    <button type="button" className="botao-secundario"
                      onClick={() => { setSegundoFator(null); setCodigoLogin(''); }}>Gerar outra chave</button>
                  </div>
                )}
                <label>
                  Código do autenticador
                  <input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}"
                    value={codigoLogin} maxLength={6} onChange={(evento) => setCodigoLogin(evento.target.value)} />
                </label>
              </>
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
          <p className="acesso-nota">Conectando pessoas ao que faz falta.</p>
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
    { id: 'registrar-balcao', nome: 'Registrar objeto' },
    { id: 'ocorrencia', nome: 'A ocorrência' },
  ];

  // A permissão vem da conta autenticada, sem decidir administração pelo e-mail no navegador.
  const administrador = usuario.tipo === 'admin';
  const podeOperarBalcao = administrador || usuario.tipo === 'equipe';
  const telasGestao = administrador
    ? [...telasEquipe, { id: 'equipe', nome: 'Cadastrar equipe' }]
    : telasEquipe;
  const telasAtuais = usuario.tipo === 'visitante' ? telasVisitante : telasGestao;

  return (
    <div className="app-shell">
      <header className="cabecalho">
        <Marca />
        <div className="identidade-usuario">
          <span className="avatar" aria-hidden="true">{usuario.nome?.trim().charAt(0).toUpperCase()}</span>
          <div>
            <strong>{usuario.nome}</strong>
            <span>{administrador ? 'Administrador' : usuario.tipo === 'visitante' ? 'Visitante' : 'Equipe do balcão'}</span>
          </div>
        </div>
        <div className="acoes-cabecalho">
          {botaoTema}
          {/* O atalho deixa o cadastro visível sem liberar a função para outros perfis. */}
          {administrador && (
            <button type="button" onClick={() => setTela('equipe')}>
              Cadastrar usuário da equipe
            </button>
          )}
          <button type="button" className="botao-secundario" onClick={sair}>
            Sair
          </button>
        </div>
      </header>

      <section className="boas-vindas" aria-label="Seu espaço">
        <p className="sobretitulo">{usuario.tipo === 'visitante' ? 'Seu ponto de reencontro' : 'Central de atendimento'}</p>
        <h1>{usuario.tipo === 'visitante' ? 'Vamos encontrar o que faz falta.' : 'Cada objeto tem uma história de volta.'}</h1>
        <p>{usuario.tipo === 'visitante' ? 'Registre uma perda e acompanhe cada novidade por aqui.' : 'Organize os avisos, registre os achados e ajude a completar reencontros.'}</p>
      </section>

      <nav className="navegacao" aria-label="Telas do sistema">
        {telasAtuais.map((item) => (
          <button
            key={item.id}
            className={tela === item.id ? 'ativo' : ''}
            aria-current={tela === item.id ? 'page' : undefined}
            onClick={() => setTela(item.id)}
          >
            {item.nome}
          </button>
        ))}
      </nav>

      <main className="conteudo-principal">
        {usuario.tipo === 'visitante' && tela === 'registrar' && <RegistrarPerda visitanteId={usuario.id}
          aoAbrirAviso={(id) => { setAvisoParaAbrir(id); setTela('meus'); }} />}
        {usuario.tipo === 'visitante' && tela === 'meus' && <MeusAvisos visitanteId={usuario.id} avisoInicial={avisoParaAbrir} />}
        {podeOperarBalcao && tela === 'balcao' && <Balcao
          aoAbrirAviso={(id) => { setAvisoParaAbrir(id); setTela('ocorrencia'); }} />}
        {podeOperarBalcao && tela === 'registrar-balcao' && <RegistrarPerda peloBalcao />}
        {podeOperarBalcao && tela === 'ocorrencia' && <Ocorrencia avisoInicial={avisoParaAbrir} />}
        {administrador && tela === 'equipe' && <CadastrarEquipe />}
      </main>
      <footer className="rodape">Cadê!? <span>Achados, perdidos e reencontros.</span></footer>
    </div>
  );
}

export default App;
