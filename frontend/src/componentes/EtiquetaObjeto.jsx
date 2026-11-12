import { useState } from 'react';

export default function EtiquetaObjeto({ aviso }) {
  const [aberta, setAberta] = useState(false);

  return (
    <div className="painel-retirada">
      <button type="button" className="botao-secundario" aria-expanded={aberta}
        onClick={() => setAberta(!aberta)}>{aberta ? 'Fechar etiqueta' : 'Etiqueta de guarda'}</button>
      {aberta && (
        <>
          <div className="etiqueta-impressao">
            <strong>Cadê!? · Objeto #{aviso.id}</strong>
            <p>{aviso.descricao}</p>
            <p>Local de guarda · {aviso.local_guarda || 'Ainda não informado'}</p>
          </div>
          <button type="button" onClick={() => window.print()}>Imprimir etiqueta</button>
        </>
      )}
    </div>
  );
}
