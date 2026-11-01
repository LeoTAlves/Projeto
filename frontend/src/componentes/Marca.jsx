// A mesma assinatura identifica o sistema na entrada e nas telas de cada perfil.
function Marca({ destaque = false }) {
  return (
    <div className={destaque ? 'marca marca-destaque' : 'marca'}>
      <span className="marca-simbolo" aria-hidden="true">?</span>
      <div>
        <span className="marca-nome">Cadê<span className="marca-pontuacao">!?</span></span>
        <span className="marca-descricao">Achados, perdidos e reencontros.</span>
      </div>
    </div>
  );
}

export default Marca;
