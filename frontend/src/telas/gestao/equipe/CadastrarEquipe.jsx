import { useState } from 'react';
import { cadastrarEquipe } from '../../../servicos/api';

// O administrador cria membros do balcão com senha própria, sem expor o cadastro ao público.
function CadastrarEquipe() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');

  // A confirmação evita erros de digitação; o backend valida a permissão e protege a senha.
  const cadastrar = async (evento) => {
    evento.preventDefault();
    setErro('');
    setMensagem('');
    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    setEnviando(true);
    try {
      const usuario = await cadastrarEquipe({ nome, email, senha });
      setMensagem('Conta de ' + usuario.nome + ' criada para a equipe do balcão.');
      setNome('');
      setEmail('');
      setSenha('');
      setConfirmarSenha('');
    } catch (falha) {
      setErro(falha.message || 'Não foi possível cadastrar o membro da equipe.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="cartao">
      <h3>Cadastrar equipe</h3>
      <p>Cadastre quem atenderá no balcão. A nova conta terá acesso aos avisos e às ocorrências.</p>
      <form onSubmit={cadastrar} className="formulario">
        <fieldset disabled={enviando} className="formulario cadastro-equipe">
          <legend>Dados do novo membro</legend>
          <label>
            Nome
            <input required minLength={3} maxLength={100} value={nome}
              onChange={(evento) => setNome(evento.target.value)} autoComplete="off" />
          </label>
          <label>
            E-mail
            <input required type="email" minLength={5} maxLength={100} value={email}
              onChange={(evento) => setEmail(evento.target.value)} autoComplete="off" />
          </label>
          <label>
            Senha
            <input required type="password" minLength={8} maxLength={100} value={senha}
              onChange={(evento) => setSenha(evento.target.value)} autoComplete="new-password" />
          </label>
          <label>
            Confirmar senha
            <input required type="password" minLength={8} maxLength={100} value={confirmarSenha}
              onChange={(evento) => setConfirmarSenha(evento.target.value)} autoComplete="new-password" />
          </label>
          <button type="submit">{enviando ? 'Cadastrando...' : 'Cadastrar membro da equipe'}</button>
        </fieldset>
      </form>
      {erro && <p className="mensagem erro" role="alert">{erro}</p>}
      {mensagem && <p className="mensagem sucesso" role="status">{mensagem}</p>}
    </section>
  );
}

export default CadastrarEquipe;
