from fastapi import APIRouter, Depends, HTTPException, Query, status

from banco import obter_sessao
from esquemas.aviso import AvisoCriar, AvisoDetalhe, AvisoSaida
from rotas.autenticacao import GRUPO_EQUIPE, GRUPO_VISITANTE, exigir_grupo
from servicos.aviso import buscar_aviso, criar_aviso as criar_aviso_servico, listar_avisos
from servicos.usuario import obter_usuario_atual

# O router reúne os caminhos que o visitante e o balcão já utilizam.
router = APIRouter(prefix="/avisos", tags=["avisos"])


# Depends entrega a sessão da requisição; os filtros e a página seguem até o repositório.
@router.get("", response_model=list[AvisoSaida], status_code=status.HTTP_200_OK)
def listar_avisos_rotas(
    pavilhao: str | None = Query(default=None, description="Filtra por pavilhão"),
    pagina: int = Query(default=1, ge=1, description="Página de dez avisos"),
    usuario=Depends(obter_usuario_atual),
    sessao=Depends(obter_sessao),
):
    dono_id = usuario.id if usuario.tipo == GRUPO_VISITANTE else None
    return listar_avisos(sessao, pavilhao=pavilhao, visitante_id=dono_id, pagina=pagina)


# O response_model lê os atributos do modelo, incluindo aviso.ocorrencias no detalhe.
@router.get("/{aviso_id}", response_model=AvisoDetalhe, status_code=status.HTTP_200_OK)
def mostrar_aviso(
    aviso_id: int,
    usuario=Depends(obter_usuario_atual),
    sessao=Depends(obter_sessao),
):
    dono_id = usuario.id if usuario.tipo == GRUPO_VISITANTE else None
    aviso = buscar_aviso(sessao, aviso_id, dono_id)
    if aviso is None:
        raise HTTPException(status_code=404, detail="Aviso não encontrado.")
    return aviso


# A rota traduz a recusa do serviço; o serviço não conhece códigos HTTP.
@router.post("", response_model=AvisoSaida, status_code=status.HTTP_201_CREATED)
def criar_aviso_rotas(
    dados: AvisoCriar,
    usuario=Depends(exigir_grupo(GRUPO_VISITANTE)),
    sessao=Depends(obter_sessao),
):
    aviso = criar_aviso_servico(sessao, dados.model_dump(), usuario)
    if isinstance(aviso, str):
        raise HTTPException(status_code=422, detail=aviso)
    return aviso
