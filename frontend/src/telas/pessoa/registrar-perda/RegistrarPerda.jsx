import { useEffect, useState } from 'react';
import { buscarDuplicados, criarAviso } from '../../../servicos/api';
import { analisarDescricao, contextoDaDescricao, perguntasDeCalcado, revisarCampos } from '../../../servicos/descricaoObjeto';
import DetalhesDoObjeto from '../../../componentes/DetalhesDoObjeto';

import CamposDoObjeto from '../../../componentes/CamposDoObjeto';

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
  const dados = { categoria, cor, marca, pavilhao, noite };
  const editores = { categoria: setCategoria, cor: setCor, marca: setMarca, pavilhao: setPavilhao, noite: setNoite };

  // Uma descrição nova precisa de nova verificação de possíveis duplicidades.
  function atualizarDescricao(texto) {
    setDescricao(texto);
    setDuplicados([]);
    setAssistencia('');
    setAvisoSalvo(null);
  }

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
    if (perguntasDeCalcado(descricao)?.length) {
      setErro(true);
      setMensagem('Complete os detalhes do calçado indicados no formulário.');
      return;
    }
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
      setAssistencia('revisar');
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
            onChange={(evento) => atualizarDescricao(evento.target.value)}
            rows="4"
            placeholder="Ex. Perdi meus óculos pretos no pavilhão 2 ontem à noite"
          />
        </label>
        <button type="button" className="botao-secundario" disabled={descricao.trim().length < 3}
          onClick={sugerir}>{consultandoIA ? 'Analisando descrição...' : 'Preencher com ajuda da IA'}</button>
        {assistencia && <p role="status">{assistencia === 'revisar' ? revisarCampos(dados) : assistencia}</p>}
        <DetalhesDoObjeto key={descricao + categoria} descricao={descricao} categoria={categoria}
          aoAcrescentar={atualizarDescricao} />
        <CamposDoObjeto dados={dados} aoAlterar={(campo, valor) => editores[campo](valor)} />

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

