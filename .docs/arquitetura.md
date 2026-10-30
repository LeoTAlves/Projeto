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
- `POST /usuarios` exige o perfil `admin`. O cadastro público sempre cria visitantes.
- Administradores também podem registrar ocorrências. O perfil é conferido no backend.

## Autenticação e ativação do administrador

O frontend faz login, guarda o token na sessão e consulta `/usuarios/eu` para escolher as telas.
O perfil `admin` é aceito na saída, mas não como tipo de uma nova conta criada pela API.
`docs/liberar_admin.sql` promove somente a conta indicada pelo responsável no Supabase.
É necessário que ela já exista com senha criada pela aplicação. O SQL não foi executado.

## Módulo de IA planejado

O módulo ainda não foi implementado. A proposta registrada em `.docs/ia.md` usa um único agente de
comparação, sem acesso direto ao banco e sem ferramentas de escrita. O backend deverá montar os
dados, o agente deverá sugerir correspondências e Rodrigo deverá confirmar antes do registro.

