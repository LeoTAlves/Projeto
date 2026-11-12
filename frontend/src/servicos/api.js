// A configuração central permite usar os mesmos serviços nos dois ambientes.
import { URL_DA_API } from '../api.js';
const CHAVE_TOKEN = 'cade_token';

function lerToken() {
  return sessionStorage.getItem(CHAVE_TOKEN);
}

export function salvarToken(token) {
  sessionStorage.setItem(CHAVE_TOKEN, token);
}

export function limparSessao() {
  sessionStorage.removeItem(CHAVE_TOKEN);
}

async function interpretarErro(resposta) {
  const texto = await resposta.text();

  if (!texto) {
    return 'Não foi possível concluir a operação.';
  }

  try {
    const json = JSON.parse(texto);
    if (typeof json.detail === 'string') {
      return json.detail;
    }
    if (Array.isArray(json.detail)) {
      return json.detail.map((item) => item.msg || item).join(', ');
    }
    return 'Não foi possível concluir a operação.';
  } catch {
    return texto;
  }
}

async function executarRequisicao(endereco, opcoes = {}) {
  const cabecalhos = { ...(opcoes.headers || {}) };
  const token = lerToken();

  if (token) {
    cabecalhos.Authorization = `Bearer ${token}`;
  }

  if (opcoes.body && !cabecalhos['Content-Type']) {
    cabecalhos['Content-Type'] = 'application/json';
  }

  const resposta = await fetch(endereco, {
    ...opcoes,
    headers: cabecalhos,
  });

  if (!resposta.ok) {
    const mensagem = await interpretarErro(resposta);
    throw new Error(mensagem);
  }

  const conteudo = await resposta.text();
  return conteudo ? JSON.parse(conteudo) : null;
}

export async function login(dados) {
  return executarRequisicao(URL_DA_API + "/login", {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

export async function criarConta(dados) {
  return executarRequisicao(URL_DA_API + "/usuarios/cadastro", {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

export async function buscarUsuarioAtual() {
  return executarRequisicao(URL_DA_API + "/usuarios/eu");
}

// O token do administrador autoriza o cadastro; o perfil enviado é sempre equipe.
export async function cadastrarEquipe(dados) {
  return executarRequisicao(URL_DA_API + "/usuarios", {
    method: 'POST',
    body: JSON.stringify({ ...dados, tipo: 'equipe' }),
  });
}

// Os serviços do front centralizam as chamadas do fetch e tratam os estados de carregamento e de erro.
// Lista avisos e envia apenas os filtros que a tela realmente escolheu.
export async function listarAvisos(filtrosInformados = {}) {
  const consulta = new URLSearchParams();
  consulta.append('pagina', String(filtrosInformados.pagina || 1));

  if (filtrosInformados.pavilhao) {
    consulta.append('pavilhao', filtrosInformados.pavilhao);
  }

  if (filtrosInformados.visitante_id) {
    consulta.append('visitante_id', String(filtrosInformados.visitante_id));
  }
  if (filtrosInformados.pendencia) consulta.set('pendencia', filtrosInformados.pendencia);

  const parametros = consulta.toString();
  const endereco = parametros ? URL_DA_API + "/avisos?" + parametros : URL_DA_API + "/avisos";

  return executarRequisicao(endereco);
}

// Busca o detalhe que inclui as ocorrências associadas ao aviso.
export async function buscarAviso(avisoId) {
  return executarRequisicao(URL_DA_API + "/avisos/" + avisoId);
}

export function confirmarEmail(token) {
  return executarRequisicao(URL_DA_API + "/usuarios/confirmar-email", {
    method: 'POST', body: JSON.stringify({ token }),
  });
}

export function buscarDuplicados(descricao) {
  return executarRequisicao(URL_DA_API + "/avisos/possiveis-duplicados", {
    method: 'POST', body: JSON.stringify({ descricao }),
  });
}

export function sugerirAtributos(descricao) {
  return executarRequisicao(URL_DA_API + "/ia/atributos", {
    method: 'POST', body: JSON.stringify({ descricao }),
  });
}

export function sugerirCorrespondencias(dados) {
  return executarRequisicao(URL_DA_API + "/ia/sugestoes", {
    method: 'POST', body: JSON.stringify(dados),
  });
}

export function aprovarRetirada(id, dados) {
  return executarRequisicao(URL_DA_API + "/avisos/" + id + "/aprovar-retirada", {
    method: 'POST', body: JSON.stringify(dados),
  });
}

export function corrigirVinculo(id) {
  return executarRequisicao(URL_DA_API + "/avisos/" + id + "/corrigir-vinculo", { method: 'POST' });
}

export function cancelarAviso(avisoId) {
  return executarRequisicao(URL_DA_API + "/avisos/" + avisoId + "/cancelar", {
    method: 'PATCH',
  });
}

export function buscarCorrespondencias(avisoId, busca) {
  const parametros = busca ? '?' + new URLSearchParams({ busca }) : '';
  return executarRequisicao(URL_DA_API + "/avisos/" + avisoId + "/triagem" + parametros);
}

export function registrarAchadosDaTriagem(avisoId, avisoIds) {
  return executarRequisicao(URL_DA_API + "/avisos/" + avisoId + "/triagem", {
    method: 'POST',
    body: JSON.stringify({ aviso_ids: avisoIds }),
  });
}

export function registrarObjetoBalcao(dados) {
  return executarRequisicao(URL_DA_API + "/avisos/balcao", {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

export function listarVisitantes() {
  return executarRequisicao(URL_DA_API + "/usuarios")
    .then((usuarios) => usuarios.filter((usuario) => usuario.tipo === 'visitante'));
}

export function vincularVisitante(avisoId, visitanteId) {
  return executarRequisicao(URL_DA_API + "/avisos/" + avisoId + "/visitante", {
    method: 'PATCH',
    body: JSON.stringify({ visitante_id: visitanteId }),
  });
}

export function consultarCodigoRetirada(avisoId) {
  return executarRequisicao(URL_DA_API + "/avisos/" + avisoId + "/codigo-retirada", {
    cache: 'no-store',
  });
}

// Envia ao back os dados validados do novo aviso da pessoa visitante.
export async function criarAviso(dados) {
  return executarRequisicao(URL_DA_API + "/avisos", {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

// Consulta o histórico quando uma tela precisa apenas das ocorrências.
export async function listarOcorrencias(avisoId) {
  return executarRequisicao(URL_DA_API + "/avisos/" + avisoId + "/ocorrencias");
}

// Envia um achado ou uma devolução e preserva a mensagem de recusa do serviço.
export async function criarOcorrencia(avisoId, dados) {
  return executarRequisicao(URL_DA_API + "/avisos/" + avisoId + "/ocorrencias", {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}
