import { useEffect, useState } from 'react';
import { buscarDuplicados, criarAviso } from '../../../servicos/api';
import { analisarDescricao, contextoDaDescricao, descricaoGenerica } from '../../../servicos/descricaoObjeto';

const categorias = [
  'Celulares e eletrônicos', 'Carteiras e documentos', 'Chaves', 'Óculos',
  'Bolsas e mochilas', 'Roupas e acessórios', 'Outros',
];

// O rascunho é separado por conta e continua opcional se o navegador bloquear armazenamento.
function RegistrarPerda({ visitanteId, aoAbrirAviso }) {
  const chaveRascunho = 'cade-rascunho-perda-' + visitanteId;
  const [rascunho] = useState(() => {
    try { return JSON.parse(localStorage.getItem(chaveRascunho)) || {}; }
    catch { return {}; }
  });
  const [descricao, setDescricao] = useState(rascunho.descricao || '');
  const [pavilhao, setPavilhao] = useState(rascunho.pavilhao || '');
  const [noite, setNoite] = useState(rascunho.noite || '');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [categoria, setCategoria] = useState(rascunho.categoria || '');
  const [cor, setCor] = useState(rascunho.cor || '');
  const [marca, setMarca] = useState(rascunho.marca || '');
  const [duplicados, setDuplicados] = useState([]);
  const [assistencia, setAssistencia] = useState('');
  const [consultandoIA, setConsultandoIA] = useState(false);
  const [avisoSalvo, setAvisoSalvo] = useState(null);

  // Guarda as edições e remove o rascunho quando o formulário é limpo após o envio.
  useEffect(() => {
    try {
      const campos = { descricao, pavilhao, noite, categoria, cor, marca };
      if (Object.values(campos).some(Boolean)) localStorage.setItem(chaveRascunho, JSON.stringify(campos));
      else localStorage.removeItem(chaveRascunho);
    } catch { /* O cadastro continua disponível sem armazenamento local. */ }
  }, [chaveRascunho, descricao, pavilhao, noite, categoria, cor, marca]);

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
      setAvisoSalvo(resultado.id);
      setMensagem(resultado.situacao === 'aguardando retirada'
        ? 'Objeto encontrado pela triagem automática. Consulte o código de retirada em Meus avisos.'
        : `Aviso ${resultado.id} registrado. O sistema continua procurando um achado compatível.`);
      setDescricao('');
      setPavilhao('');
      setNoite('');
      setCategoria('');
      setCor('');
      setMarca('');
      setDuplicados([]);
      setAssistencia('');
    } catch (falha) {
      setErro(true);
      setMensagem(falha.message);
    } finally {
      setCarregando(false);
    }
  };

  // Preenche campos vazios e mantém os valores que a Lúcia já informou.
  async function sugerir() {
    setConsultandoIA(true);
    setMensagem('');
    setErro(false);
    setAssistencia('');
    const contexto = contextoDaDescricao(descricao);
    setPavilhao(pavilhao || contexto.pavilhao || '');
    setNoite(noite || contexto.noite || '');
    try {
      const resposta = await analisarDescricao(descricao);
      setCategoria(categoria || resposta.categoria || '');
      setCor(cor || resposta.cor || '');
      setMarca(marca || resposta.marca || '');
      const faltam = [!(pavilhao || resposta.pavilhao) && 'pavilhão', !(noite || resposta.noite) && 'data'].filter(Boolean);
      setAssistencia(faltam.length ? 'Revise os dados e informe ' + faltam.join(' e ') + '.'
        : 'Revise os campos antes de registrar.');
    } catch {
      setAssistencia('A sugestão de atributos está indisponível. Você pode completar ou revisar os campos.');
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
            onChange={(evento) => { setDescricao(evento.target.value); setDuplicados([]); setAssistencia(''); setAvisoSalvo(null); }}
            rows="4"
            placeholder="Ex. Perdi meus óculos pretos no pavilhão 2 ontem à noite"
          />
        </label>
        <button type="button" className="botao-secundario" disabled={descricao.trim().length < 3}
          onClick={sugerir}>{consultandoIA ? 'Analisando descrição...' : 'Preencher com ajuda da IA'}</button>
        {assistencia && <p role="status">{assistencia}</p>}
        {descricaoGenerica(descricao) && (
          <small>Se souber, acrescente uma marca, risco, adesivo ou acessório à descrição.</small>
        )}
        <label>
          Categoria
          <select value={categoria} onChange={(evento) => setCategoria(evento.target.value)}>
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
          <select required value={pavilhao} onChange={(evento) => setPavilhao(evento.target.value)}>
            <option value="">Selecione o pavilhão</option>
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
      {avisoSalvo && <button type="button" onClick={() => aoAbrirAviso(avisoSalvo)}>Ver meu aviso</button>}
    </section>
  );
}

export default RegistrarPerda;

