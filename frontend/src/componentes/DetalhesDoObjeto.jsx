import { useState } from 'react';
import { perguntasSobreObjeto } from '../servicos/descricaoObjeto';

// Faz perguntas sobre características observáveis e acrescenta a resposta à descrição.
export default function DetalhesDoObjeto({ descricao, categoria, aoAcrescentar }) {
  const [resposta, setResposta] = useState('');
  const perguntas = perguntasSobreObjeto(descricao, categoria);
  const limite = 200 - descricao.trim().length - 2;
  if (!perguntas.length || limite < 3) return null;

  // Enter neste campo acrescenta o detalhe em vez de enviar o cadastro inteiro.
  function acrescentar() {
    const detalhe = resposta.trim();
    if (!detalhe || detalhe.length > limite) return;
    aoAcrescentar(descricao.trim() + '; ' + detalhe);
    setResposta('');
  }

  return (
    <div className="painel-retirada">
      <strong>Ajude a identificar o objeto</strong>
      <ul>{perguntas.map((pergunta) => <li key={pergunta}>{pergunta}</li>)}</ul>
      <label>
        Detalhe adicional (opcional)
        <input value={resposta} maxLength={limite} onChange={(evento) => setResposta(evento.target.value)}
          onKeyDown={(evento) => {
            if (evento.key !== 'Enter' || evento.nativeEvent.isComposing) return;
            evento.preventDefault();
            acrescentar();
          }} />
      </label>
      <small>Use características visíveis. Evite senhas e números de documentos.</small>
      <button type="button" className="botao-secundario"
        disabled={!resposta.trim() || resposta.trim().length > limite}
        onClick={acrescentar}>Acrescentar à descrição</button>
    </div>
  );
}
