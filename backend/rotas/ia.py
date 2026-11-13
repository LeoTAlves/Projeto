from fastapi import APIRouter, Depends, HTTPException, status

from banco import obter_sessao
from esquemas.aviso import AtributosObjeto, DescricaoObjeto
from ia.modelos import ProvedoresIndisponiveis
from ia.sugestao import (
    SugestaoIACriar,
    SugestaoIAResposta,
    sugerir_atributos as sugerir_atributos_ia,
    sugerir_correspondencias,
)
from rotas.autenticacao import GRUPO_ADMIN, GRUPO_EQUIPE, exigir_grupo
from servicos.usuario import obter_usuario_atual


router = APIRouter(
    prefix="/ia",
    tags=["inteligência artificial"],
)


# A rota delega a análise sem gravar e converte a indisponibilidade total em resposta manual recuperável.
@router.post("/sugestoes", response_model=SugestaoIAResposta)
def criar_sugestoes(
    dados: SugestaoIACriar,
    usuario=Depends(exigir_grupo(GRUPO_EQUIPE, GRUPO_ADMIN)),
    sessao=Depends(obter_sessao),
):
    try:
        return sugerir_correspondencias(sessao, dados)
    except ProvedoresIndisponiveis as erro:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="A IA não respondeu. Continue pela conferência manual.",
        ) from erro


# A rota limita-se a delegar a extração para a função da pasta de IA.
@router.post("/atributos", response_model=AtributosObjeto)
def sugerir_atributos(dados: DescricaoObjeto, usuario=Depends(obter_usuario_atual)):
    return sugerir_atributos_ia(dados)
