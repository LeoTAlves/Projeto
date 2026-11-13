import { useState } from 'react';
import { buscarDuplicados, criarAviso, sugerirAtributos } from '../../../servicos/api';

const categorias = [
  'Celulares e eletrônicos', 'Carteiras e documentos', 'Chaves', 'Óculos',
  'Bolsas e mochilas', 'Roupas e acessórios', 'Outros',
];

// A tela de visitante registra o aviso novo com descrição, pavilhão e noite.
function RegistrarPerda({ aoAbrirAviso }) {
  const [descricao, setDescricao] = useState('');
  const [pavilhao, setPavilhao] = useState('Pavilhao 1');
  const [noite, setNoite] = useState('2026-10-10');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [categoria, setCategoria] = useState('');
  const [cor, setCor] = useState('');
  const [marca, setMarca] = useState('');
  const [duplicados, setDuplicados] = useState([]);
  const [sugestao, setSugestao] = useState(null);
  const [consultandoIA, setConsultandoIA] = useState(false);

  // O envio usa o visitante escolhido no perfil e mostra claramente sucesso ou falha.
  const enviarFormulario = async (evento) => {
    evento.preventDefault();
    setCarregando(true);
    setMensagem('');
    setErro(false);

    try {
      if (!duplicados.length) {
        const semelhantes = await buscarDuplicados(descricao);
        if (semelhantes.length) {
          setDuplicados(semelhantes);
          return;
        }
      }
      const resultado = await criarAviso({
        descricao, pavilhao, noite, categoria: categoria || null,
        cor: cor.trim() || null, marca: marca.trim() || null,
      });
      setMensagem(resultado.situacao === 'aguardando retirada'
        ? 'Objeto encontrado pela triagem automática. Consulte o código de retirada em Meus avisos.'
        : `Aviso ${resultado.id} registrado. O sistema continua procurando um achado compatível.`);
      setDescricao('');
      setPavilhao('Pavilhao 1');
      setNoite('2026-10-10');
      setCategoria('');
      setCor('');
      setMarca('');
      setDuplicados([]);
      setSugestao(null);
    } catch (falha) {
      setErro(true);
      setMensagem(falha.message);
    } finally {
      setCarregando(false);
    }
  };

  async function sugerir() {
    setConsultandoIA(true);
    setMensagem('');
    setErro(false);
    setSugestao(null);
    try {
      const resposta = await sugerirAtributos(descricao);
      if (resposta.categoria || resposta.cor || resposta.marca) setSugestao(resposta);
      else setMensagem('A descrição não trouxe atributos suficientes. Preencha os campos manualmente.');
    } catch (falha) {
      setErro(true);
      setMensagem(falha.message);
    } finally {
      setConsultandoIA(false);
    }
  }

  return (
    <section className="cartao">
      <h3>Registrar perda</h3>
      <p className="texto-apoio">Conte o que você perdeu. Quanto mais detalhes, mais fácil reconhecer.</p>
      <form onSubmit={enviarFormulario} className="formulario">
        <fieldset disabled={carregando || consultandoIA} className="formulario cadastro-equipe">
        <label>
          Descrição do objeto
          <textarea
            required
            minLength="3"
            maxLength="200"
            value={descricao}
            onChange={(evento) => { setDescricao(evento.target.value); setDuplicados([]); setSugestao(null); }}
            rows="4"
            placeholder="Descreva o objeto perdido"
          />
        </label>
        <button type="button" className="botao-secundario" disabled={descricao.trim().length < 3}
          onClick={sugerir}>{consultandoIA ? 'Consultando IA...' : 'Sugerir atributos com IA'}</button>
        {sugestao && (
          <div className="painel-retirada">
            <p>Atributos sugeridos — {[sugestao.categoria, sugestao.cor, sugestao.marca].filter(Boolean).join(' · ')}</p>
            <button type="button" className="botao-secundario" onClick={() => {
              setCategoria(sugestao.categoria || categoria);
              setCor(sugestao.cor || cor);
              setMarca(sugestao.marca || marca);
              setSugestao(null);
            }}>Usar sugestão</button>
          </div>
        )}
        <label>
          Categoria
          <select required value={categoria} onChange={(evento) => setCategoria(evento.target.value)}>
            <option value="">Selecione uma categoria</option>
            {categorias.map((nome) => <option key={nome}>{nome}</option>)}
          </select>
        </label>
        <div className="formulario">
          <label>Cor<input maxLength={100} value={cor} onChange={(evento) => setCor(evento.target.value)} /></label>
          <label>Marca<input maxLength={100} value={marca} onChange={(evento) => setMarca(evento.target.value)} /></label>
        </div>

        <div className="formulario">
        <label>
          Pavilhão
          <select value={pavilhao} onChange={(evento) => setPavilhao(evento.target.value)}>
            <option value="Pavilhao 1">Pavilhão 1</option>
            <option value="Pavilhao 2">Pavilhão 2</option>
            <option value="Pavilhao 3">Pavilhão 3</option>
          </select>
        </label>

        <label>
          Noite
          <input
            required
            type="date"
            value={noite}
            onChange={(evento) => setNoite(evento.target.value)}
          />
        </label>
        </div>

        {duplicados.length > 0 && (
          <div className="painel-retirada" role="status">
            <strong>Você já registrou este objeto?</strong>
            {duplicados.map((aviso) => (
              <button key={aviso.id} type="button" className="botao-secundario"
                onClick={() => aoAbrirAviso(aviso.id)}>Abrir aviso #{aviso.id} · {aviso.descricao}</button>
            ))}
          </div>
        )}
        <button type="submit">
          {carregando ? 'Salvando...' : duplicados.length ? 'Registrar outro objeto' : 'Enviar aviso'}
        </button>
        </fieldset>
      </form>

      {mensagem && <p className={erro ? 'mensagem erro' : 'mensagem sucesso'} role="status">{mensagem}</p>}
    </section>
  );
}

export default RegistrarPerda;

