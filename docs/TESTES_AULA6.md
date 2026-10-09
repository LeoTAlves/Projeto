# Conferência da aula 6

Use o backend e o frontend iniciados conforme o README. Os exemplos abaixo pressupõem Lúcia cadastrada como visitante de id 1 e Rodrigo como equipe de id 2.

## 1. Tabelas e relação

No Workbench, conectado ao banco `cade`:

```sql
USE cade;
SHOW TABLES;
DESCRIBE usuarios;
DESCRIBE avisos;
DESCRIBE ocorrencias;
SHOW CREATE TABLE ocorrencias;
```

Devem existir as três tabelas do DER. A última consulta deve mostrar uma chave estrangeira de `ocorrencias.aviso_id` para `avisos.id`. As tabelas devem usar InnoDB para suportar a transação.

Compare o resultado com `docs/DER.md`. Os campos de data devem ser `DATE` e as descrições `VARCHAR(200) NOT NULL`.

## 2. Criar e consultar

No `/docs`, execute `POST /avisos`:

```json
{
  "descricao": "Óculos de grau pretos",
  "pavilhao": "Pavilhao 1",
  "noite": "2026-10-05",
  "visitante_id": 1
}
```

Espere `201`, um id gerado pelo banco e a situação `procurando`. Anote esse id e use-o nos próximos passos. O detalhe `GET /avisos/{id}` deve incluir `ocorrencias: []`.

## 3. Persistência

Pare a API com Ctrl+C, inicie-a novamente e consulte o mesmo id. O aviso deve continuar existindo. Os dados agora pertencem ao MySQL, e não a uma lista criada quando o Python inicia.

## 4. Regra inteira

Execute `POST /avisos/{id}/ocorrencias`:

```json
{
  "tipo": "objeto achado",
  "descricao": "Óculos encontrados junto ao balcão"
}
```

Espere `201`. O GET do aviso deve mostrar `aguardando retirada`, e o GET das ocorrências deve conter o achado com sua data.

Depois envie uma ocorrência com `tipo: "devolucao"`. Espere `201` e a situação `devolvido`. Tente registrar outra ocorrência, de qualquer um dos dois tipos: deve voltar `422`, sem alterar a situação nem aumentar o histórico.

A cartilha também permite registrar uma devolução diretamente em um aviso `procurando`: ela não exige um achado anterior.

## 5. Rollback: erro no meio da regra

Crie outro aviso, ainda em `procurando`. Para repetir a experiência ensinada em aula, acrescente temporariamente esta linha em `backend/servicos/ocorrencia.py`, logo antes do retorno que chama `repositorio_ocorrencia.criar_ocorrencia`:

```python
raise ValueError("teste do rollback")
```

Com a API em modo de desenvolvimento, envie uma ocorrência. Espere `500`. Consulte o aviso: ele deve continuar em `procurando`, sem nenhuma ocorrência. O fechamento da sessão sem commit desfez a transação.

Remova a linha temporária e tente novamente. Deve voltar `201`, com a situação e a ocorrência gravadas juntas. Não entregue o código com a falha proposital.

## 6. Filtros, ordem e página

- Cadastre mais de dez avisos, incluindo pavilhões e noites diferentes.
- Consulte `GET /avisos?pagina=1`: até dez registros, por noite crescente, com id como desempate.
- Consulte `GET /avisos?pagina=2`: os próximos registros, sem repetir os da página 1.
- Combine `pavilhao=Pavilhao 1` com `visitante_id=1`: só os avisos que atendem aos dois filtros.
- Uma página além do fim devolve `200` e `[]`.
- `pagina=0`, `pagina=-1` e `pagina=abc` devolvem `422`.

No balcão, mudar o filtro volta à primeira página. Nas telas Meus avisos e A ocorrência, os botões Anterior/Próxima dão acesso aos avisos das outras páginas.

## 7. Entradas inválidas

- Descrição com menos de 3 ou mais de 200 caracteres: `422`.
- Pavilhão que não seja um dos três da cartilha: `422`.
- Noite como `2026-02-30`: `422`.
- Usuário inexistente ou usuário do tipo equipe ao criar uma perda: `422`.
- GET ou POST de ocorrência para aviso inexistente: `404`.
- Tipo de ocorrência diferente de `objeto achado` ou `devolucao`: `422`.

As recusas não devem criar registros nem mudar a situação de avisos.

## 8. Preparação para apresentar

Explique com suas palavras:

1. Por que o modelo é diferente do esquema e por que a descrição possui o mesmo limite nos dois?
2. Por que um único commit é necessário quando uma ocorrência muda a situação do aviso?
3. O que acontece se ocorrer erro antes do commit?
4. Qual a diferença entre ForeignKey e relationship?
5. Por que filtrar no banco e ordenar antes de paginar?

## Verificação automatizada realizada

Na implementação, passaram 13 cenários de integração em um schema MySQL temporário e independente do `cade`: estrutura das tabelas, criação e datas, regra e recusas, devolução direta, contagem de um único commit, rollback antes da gravação, rollback por falha de chave estrangeira durante o INSERT, filtros/páginas/ordenação, respostas 404, validações 422, persistência em outro processo Python, criação repetida das tabelas sem apagar registros, documentação e CORS.

Os dados de teste foram removidos com o schema temporário. O banco `cade` mantém os usuários iniciais da cartilha e está pronto para registrar seus avisos.
