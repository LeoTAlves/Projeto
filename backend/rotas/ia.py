from fastapi import APIRouter, Depends, HTTPException, status

from banco import obter_sessao
from esquemas.ia import SugestaoIACriar, SugestaoIAResposta
from ia.modelos import ProvedoresIndisponiveis
from ia.sugestao import sugerir_correspondencias
from rotas.autenticacao import GRUPO_ADMIN, GRUPO_EQUIPE, exigir_grupo


router = APIRouter(
    prefix="/ia",
    tags=["inteligência artificial"],
    dependencies=[Depends(exigir_grupo(GRUPO_EQUIPE, GRUPO_ADMIN))],
)


@router.post("/sugestoes", response_model=SugestaoIAResposta)
def criar_sugestoes(
    dados: SugestaoIACriar,
    sessao=Depends(obter_sessao),
):
    try:
        return sugerir_correspondencias(sessao, dados)
    except ProvedoresIndisponiveis as erro:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(erro),
        ) from erro
