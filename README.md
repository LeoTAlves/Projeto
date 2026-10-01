# Cadê, achados e perdidos de evento

Projeto em React + FastAPI para registrar avisos de perda e cruzar ocorrências de objetos achados.

**Cartilha 5 — Cadê, achados e perdidos de evento.** Lúcia registra e acompanha perdas; Rodrigo, da equipe do balcão, cruza os avisos com os achados; um achado muda a situação para aguardando retirada e a devolução para devolvido, sem novas ocorrências depois dela.

O conteúdo de referência fica em [docs/CARTILHA.md](docs/CARTILHA.md). O briefing, a marca e o styleguide estão em `docs/`.

## Requisitos
- Python 3.11+
- Node.js 18+
- npm

## Backend
1. Entre na pasta `backend`.
2. Crie o ambiente virtual com `python -m venv .venv`.
3. Ative o ambiente virtual.
4. Instale as dependências: `pip install fastapi uvicorn python-dotenv`.
5. Inicie a API: `python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload`.
6. A documentação fica em `http://localhost:8000/docs`.

## Frontend
1. Entre na pasta `frontend`.
2. Instale as dependências: `npm install`.
3. Inicie o app: `npm run dev -- --host 0.0.0.0`.
4. Abra `http://localhost:5173`.

## Observações
- A origem do CORS fica em `backend/.env` e as chaves de exemplo em `backend/.env.exemplo`.
- Os dados ficam em memória dentro do repositório do backend.
- Para rodar localmente, configure `FRONTEND_URL=http://localhost:5173` em `backend/.env`.
