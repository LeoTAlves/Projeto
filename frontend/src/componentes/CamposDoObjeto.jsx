const categorias = [
  'Celulares e eletrônicos', 'Carteiras e documentos', 'Chaves', 'Óculos',
  'Bolsas e mochilas', 'Roupas e acessórios', 'Outros',
];

// Os dois perfis revisam os mesmos dados antes de enviar o registro.
export default function CamposDoObjeto({ dados, aoAlterar, achado = false }) {
  return (
    <>
      <label>Categoria
        <select required value={dados.categoria} onChange={(e) => aoAlterar('categoria', e.target.value)}>
          <option value="">Selecione uma categoria</option>
          {categorias.map((nome) => <option key={nome}>{nome}</option>)}
        </select>
      </label>
      <label>Cor principal
        <input required pattern=".*\S.*" maxLength={100} value={dados.cor}
          onChange={(e) => aoAlterar('cor', e.target.value)} />
      </label>
      <label>Marca
        <input required pattern=".*\S.*" maxLength={100} value={dados.marca}
          onChange={(e) => aoAlterar('marca', e.target.value)} />
      </label>
      <button type="button" className="botao-secundario"
        onClick={() => aoAlterar('marca', 'Não identificada')}>Marca não identificada</button>
      <label>Pavilhão
        <select required value={dados.pavilhao} onChange={(e) => aoAlterar('pavilhao', e.target.value)}>
          <option value="">Selecione o pavilhão</option>
          {[1, 2, 3].map((numero) => <option key={numero} value={'Pavilhao ' + numero}>Pavilhão {numero}</option>)}
        </select>
      </label>
      <label>{achado ? 'Data em que foi encontrado' : 'Noite da perda'}
        <input required type="date" value={dados.noite} onChange={(e) => aoAlterar('noite', e.target.value)} />
      </label>
    </>
  );
}
