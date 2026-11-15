import { sugerirAtributos } from './api';

// Converte datas do aparelho sem deslocar o dia por causa do fuso UTC.
function dataLocal(data) {
  return [data.getFullYear(), data.getMonth() + 1, data.getDate()]
    .map((numero) => String(numero).padStart(2, '0')).join('-');
}

// Usa expressões explícitas na descrição para evitar adivinhar pavilhão e data.
export function contextoDaDescricao(descricao, hoje = new Date()) {
  const pavilhao = descricao.match(/\bpavilh(?:ão|ao)\s*([123])\b/i)?.[1];
  const absoluta = descricao.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?\b/);
  let noite;
  if (absoluta) {
    const [, dia, mes, ano = hoje.getFullYear()] = absoluta;
    const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
    if (data.getFullYear() === Number(ano) && data.getMonth() + 1 === Number(mes)
      && data.getDate() === Number(dia)) noite = dataLocal(data);
  } else if (/\b(hoje|ontem)\b/i.test(descricao)) {
    const data = new Date(hoje);
    if (/\bontem\b/i.test(descricao)) data.setDate(data.getDate() - 1);
    noite = dataLocal(data);
  }
  return { pavilhao: pavilhao && 'Pavilhao ' + pavilhao, noite };
}

// Uma descrição curta pode ganhar uma característica distintiva sem bloquear o registro.
export function descricaoGenerica(descricao) {
  const objeto = descricao.replace(/\bpavilh(?:ão|ao)\s*[123]\b|\b\d{1,2}\/\d{1,2}(?:\/\d{4})?\b/gi, '');
  const termos = objeto.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) || [];
  const palavrasDeContexto = ['perdi', 'recebi', 'achei', 'encontrei', 'uma', 'uns', 'meu', 'minha',
    'meus', 'minhas', 'com', 'hoje', 'ontem', 'noite', 'no', 'na', 'de', 'do', 'da'];
  const detalhes = new Set(termos.filter((termo) => !palavrasDeContexto.includes(termo)));
  return detalhes.size > 0 && detalhes.size < 4;
}

// A sugestão reúne os atributos da IA e o contexto explícito da frase.
export async function analisarDescricao(descricao) {
  const atributos = await sugerirAtributos(descricao);
  return { ...atributos, ...contextoDaDescricao(descricao) };
}
