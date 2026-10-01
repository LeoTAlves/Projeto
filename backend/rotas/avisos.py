from fastapi import APIRouter, HTTPException, Query, status

from esquemas.aviso import AvisoCriar, AvisoDetalhe, AvisoSaida
from servicos.aviso import buscar_aviso, criar_aviso as criar_aviso_servico, listar_avisos

# A rota de avisos concentra as ações do visitante e do balcão sobre a lista e o detalhe do aviso.
router = APIRouter(prefix="/avisos", tags=["avisos"])

# Lista os avisos com filtros opcionais por pavilhão e por visitante, conforme a tela solicitante.
@router.get("", response_model=list[AvisoSaida], status_code=status.HTTP_200_OK)
def listar_avisos_rotas(
    pavilhao: str | None = Query(default=None, description="Filtra por pavilhão"),
    visitante_id: int | None = Query(default=None, description="Filtra por visitante"),
):
    return listar_avisos(pavilhao=pavilhao, visitante_id=visitante_id)

# Mostra o aviso completo e as ocorrências associadas ao registro escolhido.
@router.get("/{aviso_id}", response_model=AvisoDetalhe, status_code=status.HTTP_200_OK)
def mostrar_aviso(aviso_id: int):
    aviso = buscar_aviso(aviso_id)
    if aviso is None:
        raise HTTPException(status_code=404, detail="Aviso não encontrado.")
    return aviso

# Cria um aviso novo em nome do visitante, começando sempre em procurando.
@router.post("", response_model=AvisoSaida, status_code=status.HTTP_201_CREATED)
def criar_aviso_rotas(dados: AvisoCriar):
    aviso = criar_aviso_servico(dados.model_dump())
    return aviso
