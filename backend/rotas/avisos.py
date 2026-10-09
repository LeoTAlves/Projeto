from fastapi import APIRouter, Depends, HTTPException, Query, status

from banco import obter_sessao
from esquemas.aviso import AvisoCriar, AvisoDetalhe, AvisoSaida
from servicos.aviso import buscar_aviso, criar_aviso as criar_aviso_servico, listar_avisos

# O router reúne os caminhos que o visitante e o balcão já utilizam.
router = APIRouter(prefix="/avisos", tags=["avisos"])


# Depends entrega a sessão da requisição; os filtros e a página seguem até o repositório.
@router.get("", response_model=list[AvisoSaida], status_code=status.HTTP_200_OK)
def listar_avisos_rotas(
    pavilhao: str | None = Query(default=None, description="Filtra por pavilhão"),
    visitante_id: int | None = Query(default=None, description="Filtra por visitante"),
    pagina: int = Query(default=1, ge=1, description="Página de dez avisos"),
    sessao=Depends(obter_sessao),
):
    return listar_avisos(sessao, pavilhao=pavilhao, visitante_id=visitante_id, pagina=pagina)


# O response_model lê os atributos do modelo, incluindo aviso.ocorrencias no detalhe.
@router.get("/{aviso_id}", response_model=AvisoDetalhe, status_code=status.HTTP_200_OK)
def mostrar_aviso(aviso_id: int, sessao=Depends(obter_sessao)):
    aviso = buscar_aviso(sessao, aviso_id)
    if aviso is None:
        raise HTTPException(status_code=404, detail="Aviso não encontrado.")
    return aviso


# A rota traduz a recusa do serviço; o serviço não conhece códigos HTTP.
@router.post("", response_model=AvisoSaida, status_code=status.HTTP_201_CREATED)
def criar_aviso_rotas(dados: AvisoCriar, sessao=Depends(obter_sessao)):
    aviso = criar_aviso_servico(sessao, dados.model_dump())
    if isinstance(aviso, str):
        raise HTTPException(status_code=422, detail=aviso)
    return aviso
