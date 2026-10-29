# Arquitetura do projeto

## Estado atual confirmado

- O frontend usa React e fica em `frontend/`.
- O backend usa FastAPI e fica em `backend/`.
- O banco usado pelo backend é MySQL.
- `backend/rotas/` recebe a requisição, chama `backend/servicos/` e traduz o resultado para HTTP.
- `backend/servicos/` concentra as regras do projeto.
- `backend/repositorios/` consulta e grava os modelos usando a sessão recebida.
- `backend/esquemas/` contém os esquemas Pydantic.
- `backend/modelos/` contém os modelos SQLAlchemy.
- `backend/rotas/autenticacao.py` possui login, token JWT e dependências dos grupos `visitante` e
  `equipe`.
- A regra de dono dos avisos usa o usuário autenticado no backend.
- A tela `Balcao.jsx` lista avisos e filtra por pavilhão.
- A tela `Ocorrencia.jsx` registra achados e devoluções.

## Pendência conhecida

O backend já exige autenticação, mas o frontend ainda precisa fazer login, guardar o token durante a
sessão e enviá-lo nas chamadas protegidas.

## Módulo de IA planejado

O módulo ainda não foi implementado. A proposta registrada em `.docs/ia.md` usa um único agente de
comparação, sem acesso direto ao banco e sem ferramentas de escrita. O backend deverá montar os
dados, o agente deverá sugerir correspondências e Rodrigo deverá confirmar antes do registro.

