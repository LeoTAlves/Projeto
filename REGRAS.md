# Regras do projeto para a IA - aula 6

Estas regras atualizam a etapa da aula 5 para o exercício 6 da UC4. A versão anterior permanece em `REGRAS_AULA5.md`.

## Projeto

Cartilha 5 - Cadê, achados e perdidos de evento. Lúcia registra perdas; Rodrigo, do balcão, registra achados e devoluções. Um aviso devolvido recusa novas ocorrências.

A cartilha original em `docs/CARTILHA.md` é a fonte das regras de negócio e não deve ser alterada. Preserve o briefing, a marca e o styleguide. As escolhas de modelagem estão justificadas em `docs/DER.md`.

## Estrutura e camadas

- `frontend/`: React e fetch, com as quatro telas da cartilha.
- `backend/configuracao.py`: único arquivo que lê o `.env`.
- `backend/banco.py`: engine, Sessao, Base e obter_sessao.
- `backend/criar_tabelas.py`: importa os três modelos e chama create_all, executado manualmente.
- `backend/main.py`: cria a aplicação, registra CORS e inclui os routers; nenhuma rota nele.
- `backend/rotas/`: arquivos no plural, parâmetros, Depends e códigos HTTP.
- `backend/servicos/`: arquivos no singular, decisões e regra da cartilha.
- `backend/repositorios/`: arquivos no singular, consultas e gravações.
- `backend/esquemas/`: classes Pydantic de entrada e saída.
- `backend/modelos/`: classes SQLAlchemy das três entidades.
- Cada pasta Python possui `__init__.py` vazio.

A chamada segue rota → serviço → repositório. A mesma sessão passa como primeiro argumento aos serviços e repositórios. As rotas recebem a sessão por Depends; os repositórios não abrem nem fecham sessões.

Só os modelos, repositórios e o script de criação conhecem as classes das tabelas. Serviços trabalham com os objetos recebidos, sem importar modelos nem chamar métodos da sessão.

## Recursos da aula 6

- MySQL, SQLAlchemy 2, Alembic e o driver mysql+mysqlconnector.
- DeclarativeBase, Column, Integer, String(n), Date e ForeignKey.
- ForeignKey nas duas relações e relationship simples para acessar as ocorrências de um aviso.
- with e yield para uma sessão por requisição.
- select, get, add, commit e refresh no repositório.
- where, order_by, limit e offset para filtros e paginação no MySQL.
- Um commit para gravar a alteração do aviso junto com a ocorrência.
- O fechamento sem commit desfaz a transação.
- Objetos do modelo usam ponto; dicionários de entrada continuam usando colchetes.
- Até a página 24, o serviço recusa com None ou mensagem e a rota decide o status com if; as exceções nomeadas ficam preparadas para a integração seguinte.
- Exceções de negócio ficam em `servicos/excecoes.py`, com uma classe por motivo da cartilha.
- Código síncrono com def; comentários, nomes e mensagens em português.
- Datas no esquema e no modelo devem concordar; os limites de String acompanham Field.
- FastAPI serializa os modelos com response_model; não usar orm_mode do Pydantic 1.

## Limites desta entrega

Nesta etapa da aula 7, o projeto contém o Alembic configurado, o `ForeignKey` nomeado em `Aviso.visitante_id` e a primeira migration em `migracoes/versions/`. Como essa chave já existia fisicamente no banco, a migration registra a sincronização sem recriar a constraint.

Não acrescentar login, JWT, async def, SQLite, SQL manual na aplicação, Mapped/mapped_column, relacionamentos avançados, axios ou novas regras de negócio. A integração das exceções nas rotas e nos serviços ainda não faz parte desta etapa.

Se for necessário mudar uma tabela que já existe, apontar a diferença; não apagar nem recriar a tabela para contornar a limitação de create_all.

CORS permite só a origem configurada. Senhas ficam no .env ignorado pelo Git; .env.exemplo contém as mesmas chaves vazias.

## Como trabalhar

Preservar alterações existentes. Explicar a camada e a finalidade de cada mudança. Comentar funções e blocos em português, destacando a intenção e os conceitos novos. Não alterar restrições da modelagem sem discutir as escolhas já documentadas.

Depois de alterar, conferir as rotas, a persistência, a transação, os filtros e a paginação. Manter o README com os passos reproduzíveis de instalação e as explicações de rollback e filtragem no banco.

Referência: [regras da aula 6](https://dannbeckersenac.github.io/SlidesPJP/prompts/aula-06-regras.md).
