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
function descricaoGenerica(descricao) {
  const objeto = descricao.replace(/\bpavilh(?:ão|ao)\s*[123]\b|\b\d{1,2}\/\d{1,2}(?:\/\d{4})?\b/gi, '');
  const termos = objeto.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) || [];
  const palavrasDeContexto = ['perdi', 'recebi', 'achei', 'encontrei', 'uma', 'uns', 'meu', 'minha',
    'meus', 'minhas', 'com', 'hoje', 'ontem', 'noite', 'no', 'na', 'de', 'do', 'da'];
  const detalhes = new Set(termos.filter((termo) => !palavrasDeContexto.includes(termo)));
  return detalhes.size > 0 && detalhes.size < 4;
}

// As perguntas mudam com o tipo e deixam de aparecer quando a descrição já traz aquele detalhe.
export function perguntasSobreObjeto(descricao, categoria) {
  if (descricao.trim().length < 3) return [];
  const texto = descricao.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const perguntas = [];
  const modelo = !/\b(modelo|iphone\s*\d|[as]\d{2}|redmi\s*\d|galaxy\s+[\w-]+)\b/.test(texto);
  if (/\b(celular|iphone|smartphone|tablet|notebook|fone|eletronicos)\b/.test(texto)
    || categoria === 'Celulares e eletrônicos') {
    if (modelo) perguntas.push('Qual é a marca ou o modelo? Ex.: Galaxy A54.');
    if (!/\b(capa|capinha|trinca|adesivo|arranha\w*|risco)\b/.test(texto)) {
      perguntas.push('Tem capinha, adesivo ou alguma marca visível? Qual?');
    }
  } else if (/\b(oculos|armacao)\b/.test(texto) || categoria === 'Óculos') {
    if (!/\b(redond\w*|quadrad\w*|retangular|metal|acetato)\b/.test(texto)) {
      perguntas.push('Qual é o formato ou o material da armação?');
    }
    if (!/\b(estojo|haste|arranha\w*|risco)\b/.test(texto)) perguntas.push('Tem estojo ou algum detalhe nas hastes?');
  } else if (/\b(mochila|bolsa|mala|pochete)\b/.test(texto) || categoria === 'Bolsas e mochilas') {
    if (!/\b(adesivo|chaveiro|estampa|remendo|ziper)\b/.test(texto)) {
      perguntas.push('Como é o zíper, a estampa ou o chaveiro? Tem algum remendo?');
    }
  } else if (/\b(chave|chaves|chaveiro)\b/.test(texto) || categoria === 'Chaves') {
    if (!/\b(\d+|duas|tres|quatro|cinco)\s+chaves\b/.test(texto)) perguntas.push('Quantas chaves havia no conjunto?');
    if (!/\b(chaveiro|pingente|controle)\b/.test(texto)) perguntas.push('Tem chaveiro, pingente ou controle? Como é?');
  }
  if (!perguntas.length && descricaoGenerica(descricao)) {
    perguntas.push('Que marca, cor, risco ou acessório ajudaria a distinguir esse objeto de outro parecido?');
  }
  return perguntas;
}

// A sugestão reúne os atributos da IA e o contexto explícito da frase.
export async function analisarDescricao(descricao) {
  const atributos = await sugerirAtributos(descricao);
  return { ...atributos, ...contextoDaDescricao(descricao) };
}
