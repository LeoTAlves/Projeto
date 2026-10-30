# Infraestrutura

## O que está chumbado

- [x] Resolvido: endereço local de reserva em `frontend/src/servicos/api.js`.
  O endereço agora vem exclusivamente de `VITE_URL_DA_API`, exportada por
  `frontend/src/api.js`.
  Em desenvolvimento, fica em `frontend/.env.development`.
  Em produção, fica em `frontend/.env.production`, com o valor `/api`.
  Login, usuário atual, avisos e ocorrências usam essa configuração.

## Encaminhamento na Vercel

- `frontend/vercel.json` encaminha `/api/*` para o backend público em
  `https://projeto-indol-nine.vercel.app`, retirando o prefixo `/api`.
- Exemplo: `/api/usuarios/cadastro` chega ao backend como `/usuarios/cadastro`.
- O frontend mantém `VITE_URL_DA_API=/api`. O destino público fica na configuração
  da hospedagem, sem endereço fixo no código das telas.
- A configuração pressupõe `frontend` como diretório raiz do projeto frontend
  na Vercel. O encaminhamento precisa ser validado após uma nova publicação.

### Validação em 29/10/2026

- `npm run build` concluiu com sucesso. O JavaScript gerado usa `/api`, inclui
  `/usuarios/cadastro` e não contém o endereço local da API.
- O backend público respondeu `200` em `/openapi.json` e confirmou a operação
  `POST /usuarios/cadastro`.
- O frontend publicado em `https://projeto-tt9n.vercel.app` respondeu `404` em
  `/api/openapi.json`. O encaminhamento ainda não está funcionando nessa publicação.
- Publicar `frontend/vercel.json` no projeto do frontend, com `frontend` como
  diretório raiz, e repetir a verificação. O cadastro real não foi executado.
