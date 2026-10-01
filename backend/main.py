from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from configuracao import FRONTEND_URL
from rotas.avisos import router as avisos_router
from rotas.ocorrencias import router as ocorrencias_router

# Cria a aplicação FastAPI e registra o CORS com a origem exata do front, por segurança.
app = FastAPI(title="Cadê, achados e perdidos de evento")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(avisos_router)
app.include_router(ocorrencias_router)
