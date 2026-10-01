// A URL pode ser sobrescrita pelo Vite sem mexer nas chamadas de cada tela.
const URL_DA_API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Os serviços do front centralizam as chamadas do fetch e tratam os estados de carregamento e de erro.
// Lista avisos e envia apenas os filtros que a tela realmente escolheu.
export async function listarAvisos(filtrosInformados = {}) {
  const consulta = new URLSearchParams();

  if (filtrosInformados.pavilhao) {
    consulta.append('pavilhao', filtrosInformados.pavilhao);
  }

  if (filtrosInformados.visitante_id) {
    consulta.append('visitante_id', String(filtrosInformados.visitante_id));
  }

  const parametros = consulta.toString();
  const endereco = parametros ? `${URL_DA_API}/avisos?${parametros}` : `${URL_DA_API}/avisos`;

  return fetch(endereco)
    .then((resposta) => {
      if (!resposta.ok) {
        throw new Error('Não foi possível carregar os avisos.');
      }
      return resposta.json();
    })
    .catch((erro) => {
      throw new Error(erro.message || 'Erro ao consultar avisos.');
    });
}

// Busca o detalhe que inclui as ocorrências associadas ao aviso.
export async function buscarAviso(avisoId) {
  return fetch(`${URL_DA_API}/avisos/${avisoId}`)
    .then((resposta) => {
      if (!resposta.ok) {
        throw new Error('Não foi possível abrir o aviso.');
      }
      return resposta.json();
    })
    .catch((erro) => {
      throw new Error(erro.message || 'Erro ao abrir o aviso.');
    });
}

// Envia ao back os dados validados do novo aviso da pessoa visitante.
export async function criarAviso(dados) {
  return fetch(`${URL_DA_API}/avisos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dados),
  })
    .then((resposta) => {
      if (!resposta.ok) {
        throw new Error('Não foi possível registrar o aviso.');
      }
      return resposta.json();
    })
    .catch((erro) => {
      throw new Error(erro.message || 'Erro ao registrar aviso.');
    });
}

// Consulta o histórico quando uma tela precisa apenas das ocorrências.
export async function listarOcorrencias(avisoId) {
  return fetch(`${URL_DA_API}/avisos/${avisoId}/ocorrencias`)
    .then((resposta) => {
      if (!resposta.ok) {
        throw new Error('Não foi possível carregar as ocorrências.');
      }
      return resposta.json();
    })
    .catch((erro) => {
      throw new Error(erro.message || 'Erro ao carregar ocorrências.');
    });
}

// Envia um achado ou uma devolução e preserva a mensagem de recusa do serviço.
export async function criarOcorrencia(avisoId, dados) {
  return fetch(`${URL_DA_API}/avisos/${avisoId}/ocorrencias`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dados),
  })
    .then((resposta) => {
      if (!resposta.ok) {
        return resposta.json().then((mensagem) => {
          throw new Error(mensagem.detail || 'Não foi possível registrar a ocorrência.');
        });
      }
      return resposta.json();
    })
    .catch((erro) => {
      throw new Error(erro.message || 'Erro ao registrar ocorrência.');
    });
}
