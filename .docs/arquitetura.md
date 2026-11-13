# Arquitetura do projeto

## Estado atual confirmado

- O frontend usa React e fica em `frontend/`.
- O backend usa FastAPI e fica em `backend/`.
- O responsável informou que o banco atual é PostgreSQL no Supabase.
- `backend/rotas/` recebe a requisição, chama `backend/servicos/` e traduz o resultado para HTTP.
- `backend/servicos/` concentra as regras do projeto.
- `backend/repositorios/` consulta e grava os modelos usando a sessão recebida.
- `backend/esquemas/` contém os esquemas Pydantic.
- `backend/modelos/` contém os modelos SQLAlchemy.
- `backend/rotas/autenticacao.py` possui login, token JWT e dependências dos grupos `visitante` e
  `equipe` e `admin`.
- A regra de dono dos avisos usa o usuário autenticado no backend.
- A tela `Balcao.jsx` lista avisos e filtra por pavilhão.
- A tela `Ocorrencia.jsx` registra achados e devoluções.
- A tela `CadastrarEquipe.jsx` permite ao administrador criar membros do balcão.
- `Marca.jsx` aplica o nome Cadê!? na entrada e no cabeçalho. `Situacao.jsx`
  centraliza etiquetas com cor, símbolo e texto nas listas e ocorrências.
- O administrador acessa esse formulário pelo menu Cadastrar equipe ou pelo botão
  Cadastrar usuário da equipe no cabeçalho.
- `POST /usuarios` exige o perfil `admin`. O cadastro público sempre cria visitantes.
- Administradores também podem registrar ocorrências. O perfil é conferido no backend.

## Autenticação e ativação do administrador

O frontend faz login, guarda o token na sessão e consulta `/usuarios/eu` para escolher as telas.
O perfil `admin` é aceito na saída, mas não como tipo de uma nova conta criada pela API.
`docs/liberar_admin.sql` promove somente a conta indicada pelo responsável no Supabase.
É necessário que ela já exista com senha criada pela aplicação. O SQL não foi executado.

## Módulo de IA

`backend/ia/` concentra a integração de IA, sem misturar chamadas a provedores com rotas, regras de
ocorrência ou persistência:

- `modelos.py`: configura Gemini, OpenRouter e Claude pela biblioteca Jangada e define o fallback.
- `ferramentas.py`: calcula localmente quais avisos têm pelo menos três características
  compatíveis, cria a tool local para o Agent e monta os dados do prompt. O cálculo não acessa nem
  altera o banco.
- `sugestao.py`: mantém `INSTRUCAO`, esquemas da solicitação e resposta, consulta avisos pelo
  repositório, valida e filtra as sugestões, além de centralizar a extração de atributos.
- `__init__.py`: torna a pasta um pacote Python.

`backend/rotas/ia.py` valida e encaminha a solicitação para funções de `backend/ia/`; a rota de
sugestões não grava e converte indisponibilidade total dos provedores em HTTP 503. O repositório
fornece avisos abertos para comparação. A tela `Triagem.jsx` apresenta os resultados, permite a
conferência e só então chama a rota existente de registro.

O Agent não recebe acesso direto à sessão ou ao banco e não dispõe de ferramenta de escrita ou
busca externa. Sua única tool é a função local de cálculo sobre dados já consultados. Os dados
modelo e turno são transitórios e nenhum modelo ou migration foi alterado para a IA.
