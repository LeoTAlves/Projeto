from fastapi import APIRouter, Depends, HTTPException, status

from banco import obter_sessao
from esquemas.ocorrencia import OcorrenciaCriar, OcorrenciaSaida
from servicos.ocorrencia import listar_ocorrencias_do_aviso, registrar_ocorrencia

# As ocorrências continuam subordinadas ao aviso nos caminhos utilizados pelo front.
router = APIRouter(prefix="/avisos", tags=["ocorrencias"])


# Distingue o aviso inexistente de um aviso que existe e ainda não possui ocorrências.
@router.get("/{aviso_id}/ocorrencias", response_model=list[OcorrenciaSaida], status_code=status.HTTP_200_OK)
def listar_ocorrencias_rotas(aviso_id: int, sessao=Depends(obter_sessao)):
    ocorrencias = listar_ocorrencias_do_aviso(sessao, aviso_id)
    if ocorrencias is None:
        raise HTTPException(status_code=404, detail="Aviso não encontrado.")
    return ocorrencias


# A aula 6 mantém a recusa como texto; a rota escolhe o status com if, sem exceção própria.
@router.post("/{aviso_id}/ocorrencias", response_model=OcorrenciaSaida, status_code=status.HTTP_201_CREATED)
def criar_ocorrencia_rotas(aviso_id: int, dados: OcorrenciaCriar, sessao=Depends(obter_sessao)):
    resultado = registrar_ocorrencia(sessao, aviso_id, dados.model_dump())
    if resultado is None:
        raise HTTPException(status_code=404, detail="Aviso não encontrado.")
    if isinstance(resultado, str):
        raise HTTPException(status_code=422, detail=resultado)
    return resultado
