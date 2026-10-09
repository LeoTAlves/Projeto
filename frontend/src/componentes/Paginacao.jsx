// A lista recebe dez registros por vez; uma página vazia ainda permite voltar à anterior.
function Paginacao({ pagina, quantidade, carregando, aoMudar }) {
  return (
    <nav aria-label="Paginação dos avisos" className="paginacao">
      <button type="button" disabled={carregando || pagina === 1} onClick={() => aoMudar(pagina - 1)}>
        Anterior
      </button>
      <span aria-live="polite">Página {pagina}</span>
      <button type="button" disabled={carregando || quantidade < 10} onClick={() => aoMudar(pagina + 1)}>
        Próxima
      </button>
    </nav>
  );
}

export default Paginacao;
