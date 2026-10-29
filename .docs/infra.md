# Infraestrutura

## O que está chumbado

- [x] Resolvido: endereço local de reserva em `frontend/src/servicos/api.js`.
  O endereço agora vem exclusivamente de `VITE_URL_DA_API`, exportada por
  `frontend/src/api.js`.
  Em desenvolvimento, fica em `frontend/.env.development`.
  Em produção, fica em `frontend/.env.production`, com o valor `/api`.
  Login, usuário atual, avisos e ocorrências usam essa configuração.
