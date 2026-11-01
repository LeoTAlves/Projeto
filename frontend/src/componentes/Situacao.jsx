// Cor, símbolo e texto identificam a situação sem depender apenas da percepção das cores.
function Situacao({ valor }) {
  const etiquetas = {
    procurando: { classe: 'procurando', texto: 'Procurando', simbolo: '?' },
    'aguardando retirada': { classe: 'retirada', texto: 'Aguardando retirada', simbolo: '↗' },
    devolvido: { classe: 'devolvido', texto: 'Devolvido', simbolo: '✓' },
    'objeto achado': { classe: 'retirada', texto: 'Objeto achado', simbolo: '↗' },
    devolucao: { classe: 'devolvido', texto: 'Devolução', simbolo: '✓' },
  };
  const etiqueta = etiquetas[valor] || { classe: 'neutra', texto: valor || 'Não informada', simbolo: '·' };

  return (
    <span className={'etiqueta etiqueta-' + etiqueta.classe}>
      <span className="etiqueta-simbolo" aria-hidden="true">{etiqueta.simbolo}</span>
      {etiqueta.texto}
    </span>
  );
}

// Uma legenda curta torna o significado das cores explícito em cada lista de avisos.
export function LegendaSituacoes() {
  return (
    <div className="legenda-situacoes" aria-label="Legenda das situações dos avisos">
      <Situacao valor="procurando" />
      <Situacao valor="aguardando retirada" />
      <Situacao valor="devolvido" />
    </div>
  );
}

export default Situacao;
