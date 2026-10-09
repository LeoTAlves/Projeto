# Cadê, achados e perdidos de evento

Projeto em React + FastAPI + MySQL, implementado até a aula 6 da UC4.

**Cartilha 5 - Cadê, achados e perdidos de evento.** Lúcia registra e acompanha perdas; Rodrigo, da equipe do balcão, registra achados e devoluções. A devolução encerra o aviso e impede novas ocorrências.

A cartilha original está em [docs/CARTILHA.md](docs/CARTILHA.md), o desenho do banco em [docs/DER.md](docs/DER.md), e o roteiro de conferência em [docs/TESTES_AULA6.md](docs/TESTES_AULA6.md). Briefing, marca e styleguide permanecem em `docs/`.

## Requisitos

- Python 3.11 ou superior.
- MySQL 8 em execução, com um usuário que possa criar e acessar o banco.
- Node.js 18 ou superior e npm.

## Preparar o backend do zero

No terminal PowerShell, a partir da raiz do projeto:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend/requirements.txt
```

Se `.venv` já existir, basta ativá-lo. Caso a política do PowerShell impeça a ativação, use diretamente `.\.venv\Scripts\python.exe` no lugar de `python`.

No MySQL Workbench, conectado com seu usuário, execute:

```sql
CREATE DATABASE IF NOT EXISTS cade
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Crie `backend/.env` com as chaves de `backend/.env.exemplo` e seus valores locais:

```dotenv
FRONTEND_URL=http://localhost:5173
URL_DO_BANCO=mysql+mysqlconnector://USUARIO:SENHA@localhost:3306/cade
```

Substitua `USUARIO` e `SENHA` pelas credenciais locais. Caracteres reservados na senha precisam de codificação na URL: por exemplo, `@` vira `%40`. O arquivo `.env` está fora do Git; não coloque a senha no README nem em `.env.exemplo`.

Com o ambiente ativado:

```powershell
cd backend
python criar_tabelas.py
fastapi dev main.py
```

Alternativa sem ativar o ambiente, estando em `backend/`:

```powershell
..\.venv\Scripts\python.exe criar_tabelas.py
..\.venv\Scripts\python.exe -m uvicorn main:app --reload
```

A criação mostra as tabelas `usuarios`, `avisos` e `ocorrencias`. O `create_all` cria as tabelas ausentes, mas não altera as já existentes. A criação é manual e não é chamada por `main.py`.

## Aula 7 até a página 24

O projeto já contém a estrutura do Alembic em `backend/alembic.ini` e `backend/migracoes/`. O arquivo `migracoes/env.py` importa `Base`, `engine` e os três modelos, usando `Base.metadata` e o `engine` de `banco.py`. A primeira migration está em `migracoes/versions/3ab25937a92a_chave_do_visitante.py`. Como a chave já existia no banco, o autogenerate registrou a sincronização sem tentar recriá-la. O arquivo `alembic.ini` não guarda usuário nem senha do MySQL.

Para conferir a instalação:

```powershell
cd backend
..\.venv\Scripts\python.exe -m alembic --version
```

O resultado deve mostrar a versão instalada do Alembic. Os arquivos `alembic.ini`, `migracoes/env.py`, `migracoes/README`, `migracoes/script.py.mako` e a migration em `migracoes/versions/` devem aparecer no `git status`.

Para conferir a conexão do Alembic com o banco:

```powershell
..\.venv\Scripts\python.exe -m alembic current
```

O comando deve terminar sem erro e mostrar as duas mensagens de informação do dialeto MySQL.

Para aplicar a migration:

```powershell
..\.venv\Scripts\python.exe -m alembic upgrade head
```

Depois, `alembic current` deve mostrar a revisão `3ab25937a92a (head)`.

As páginas 14 e 15 também foram conferidas: `alembic history` lista a migration, a chave estrangeira está registrada no MySQL e a aplicação continua expondo as rotas no `/docs`.

Na segunda parte da aula, a regra ganhou nomes de exceção em [backend/servicos/excecoes.py](backend/servicos/excecoes.py): `VisitanteInvalido` para um visitante inexistente ou inválido e `AvisoDevolvido` para um aviso que não aceita nova ocorrência. A integração dessas exceções no serviço e nas rotas fica para as páginas seguintes.

Depois de criar as tabelas em um banco novo, execute no Workbench o arquivo [docs/usuarios_iniciais.sql](docs/usuarios_iniciais.sql). Ele cadastra Lúcia como visitante de id 1, usado pelo frontend, e Rodrigo como equipe de id 2. Execute esse cadastro uma vez; se os usuários já existirem, não os sobrescreva.

Abra [a documentação da API](http://localhost:8000/docs). Um banco novo começa sem avisos; cadastre-os no formulário ou no POST do `/docs`.

## Iniciar o frontend

Em outro terminal:

```powershell
cd frontend
npm install
npm run dev
```

Abra [o Cadê](http://localhost:5173). O CORS autoriza a origem exata configurada em `FRONTEND_URL`. Se o Vite escolher outra porta porque a 5173 está ocupada, ajuste a origem e reinicie o backend.

As quatro telas continuam disponíveis. Balcão, Meus avisos e seleção do aviso na tela de ocorrência possuem controles para navegar entre as páginas. A seleção do perfil continua sem login, como a cartilha pede nesta etapa.

## Estrutura e responsabilidades

- `backend/configuracao.py`: único arquivo que lê o ambiente.
- `backend/banco.py`: conexão, fábrica de sessões, Base e entrega da sessão.
- `backend/modelos/`: três tabelas descritas com SQLAlchemy.
- `backend/esquemas/`: validação da entrada e formato da resposta.
- `backend/rotas/`: caminhos, parâmetros, dependências e respostas HTTP.
- `backend/servicos/`: regra da cartilha e acesso às ocorrências pelo relacionamento.
- `backend/repositorios/`: consultas, inclusão dos modelos e commit.
- `backend/criar_tabelas.py`: criação manual das tabelas.
- `docs/DER.md`: entidades, tipos, limites e relacionamentos.

Uma requisição usa uma sessão, entregue por `Depends(obter_sessao)` e passada de rota para serviço e repositório. Nenhuma função de repositório cria ou fecha sua própria sessão.

O DER mostra as duas chaves estrangeiras: `avisos.visitante_id → usuarios.id` e `ocorrencias.aviso_id → avisos.id`. O serviço também confere se o id informado ao criar um aviso pertence a um visitante, porque a chave estrangeira garante existência, mas não o tipo do usuário.

## Regra e transação: o que acontece se der erro no meio?

Um aviso nasce como **procurando**. Uma ocorrência de **objeto achado** muda o aviso para **aguardando retirada**. Uma ocorrência de **devolucao** muda para **devolvido**. Depois disso, o serviço devolve uma mensagem de recusa e a rota responde `422`.

O serviço primeiro altera a situação no objeto ligado à sessão. Em seguida, o repositório acrescenta a ocorrência e faz **um único commit**, que confirma tanto o UPDATE do aviso quanto o INSERT da ocorrência.

Se houver um erro antes de concluir esse commit, o `with` de `obter_sessao` fecha a sessão sem confirmar a transação, provocando o rollback. O aviso mantém a situação anterior e a ocorrência não é gravada. Isso também vale se o INSERT falhar durante o commit: com as tabelas InnoDB, o UPDATE não fica salvo sozinho. Um erro ocorrido depois de um commit concluído não desfaz a gravação.

O roteiro de teste explica como provocar um erro antes de gravar e conferir a recuperação. Até a página 24, os serviços e as rotas ainda usam a tradução por `if`; as classes de exceção foram apenas declaradas, conforme o passo 1 da segunda parte da aula.

## Por que filtrar no banco?

Os filtros por `pavilhao` e `visitante_id` são combinados com `.where()` no repositório. O MySQL devolve somente os registros selecionados, em vez de enviar a tabela inteira para o serviço descartar linhas em Python.

A consulta ordena por noite crescente e, em caso de empate, pelo id. Esse desempate torna a ordem previsível entre páginas. Cada página contém até dez registros, usando `limit(10)` e `offset((pagina - 1) * 10)`. O serviço só repassa os parâmetros.

A rota valida `pagina >= 1`: `pagina=0` devolve `422`. Uma página sem resultados devolve `[]`. Como a API retorna uma lista sem totalizador, uma página com exatamente dez registros permite avançar; se a próxima estiver vazia, o botão Anterior continua disponível.

## Rotas e respostas para conferir

| Método e caminho | Resultado |
| --- | --- |
| `GET /avisos` | `200`, lista paginada; aceita `pavilhao`, `visitante_id` e `pagina`. |
| `GET /avisos/{aviso_id}` | `200`, aviso com ocorrências; `404` se não existir. |
| `POST /avisos` | `201`, aviso em procurando; `422` para entrada inválida ou usuário que não seja visitante cadastrado. |
| `GET /avisos/{aviso_id}/ocorrencias` | `200`, ocorrências do aviso; `404` se o aviso não existir. |
| `POST /avisos/{aviso_id}/ocorrencias` | `201`, ocorrência e situação gravadas juntas; `404` para aviso inexistente e `422` para aviso devolvido ou entrada inválida. |

As datas usam `AAAA-MM-DD` no JSON e `DATE` no MySQL. Descrições têm de 3 a 200 caracteres. Um valor de noite que não represente uma data real é recusado com `422`.

## Conferir a entrega

Siga [docs/TESTES_AULA6.md](docs/TESTES_AULA6.md): persistência depois de reiniciar a API, regra completa, recusa após devolução, rollback, filtros combinados, ordenação, paginação, chave estrangeira e telas.

Referência da atividade: [aula 6](https://dannbeckersenac.github.io/SlidesPJP/aulas/aula-06.html) e [regras da aula 6](https://dannbeckersenac.github.io/SlidesPJP/prompts/aula-06-regras.md).
