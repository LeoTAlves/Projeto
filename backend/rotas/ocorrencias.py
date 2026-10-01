from fastapi import APIRouter, HTTPException, status

from esquemas.ocorrencia import OcorrenciaCriar, OcorrenciaSaida
from servicos.aviso import buscar_aviso, registrar_ocorrencia
from servicos.ocorrencia import listar_ocorrencias_do_aviso

# As rotas de ocorrência cuidam do registro e da leitura do histórico do aviso selecionado.
router = APIRouter(prefix="/avisos", tags=["ocorrencias"])

# Busca todas as ocorrências do aviso para a tela de detalhe ou da pessoa.
@router.get("/{aviso_id}/ocorrencias", response_model=list[OcorrenciaSaida], status_code=status.HTTP_200_OK)
def listar_ocorrencias_rotas(aviso_id: int):
    aviso = buscar_aviso(aviso_id)
    if aviso is None:
        raise HTTPException(status_code=404, detail="Aviso não encontrado.")
    return listar_ocorrencias_do_aviso(aviso_id)

# Registra uma ocorrência e aplica a regra de negócio do status do aviso.
@router.post("/{aviso_id}/ocorrencias", response_model=OcorrenciaSaida, status_code=status.HTTP_201_CREATED)
def criar_ocorrencia_rotas(aviso_id: int, dados: OcorrenciaCriar):
    aviso = buscar_aviso(aviso_id)
    if aviso is None:
        raise HTTPException(status_code=404, detail="Aviso não encontrado.")

    resultado = registrar_ocorrencia(aviso_id, dados.model_dump())
    if resultado is None:
        raise HTTPException(status_code=404, detail="Aviso não encontrado.")
    if isinstance(resultado, str):
        raise HTTPException(status_code=422, detail=resultado)
    return resultado
