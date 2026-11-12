// Cor, símbolo e texto identificam a situação sem depender apenas da percepção das cores.
function Situacao({ valor }) {
  const etiquetas = {
    procurando: { classe: 'procurando', texto: 'Procurando', simbolo: '?' },
    'aguardando retirada': { classe: 'retirada', texto: 'Aguardando retirada', simbolo: '↗' },
    devolvido: { classe: 'devolvido', texto: 'Devolvido', simbolo: '✓' },
    triado: { classe: 'neutra', texto: 'Triado', simbolo: '✓' },
    cancelado: { classe: 'neutra', texto: 'Cancelado', simbolo: '×' },
    'retirada aprovada': { classe: 'retirada', texto: 'Retirada aprovada', simbolo: '✓' },
    'em conferência': { classe: 'procurando', texto: 'Em conferência', simbolo: '?' },
    'vinculo corrigido': { classe: 'neutra', texto: 'Vínculo corrigido', simbolo: '↺' },
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

export function situacaoDoAviso(aviso) {
  if (aviso.situacao === 'aguardando retirada' && aviso.visitante_id != null) {
    return aviso.retirada_aprovada ? 'retirada aprovada' : 'em conferência';
  }
  return aviso.situacao;
}

// Uma legenda curta torna o significado das cores explícito em cada lista de avisos.
export function LegendaSituacoes() {
  return (
    <div className="legenda-situacoes" aria-label="Legenda das situações dos avisos">
      <Situacao valor="procurando" />
      <Situacao valor="aguardando retirada" />
      <Situacao valor="em conferência" />
      <Situacao valor="retirada aprovada" />
      <Situacao valor="devolvido" />
    </div>
  );
}

export default Situacao;
