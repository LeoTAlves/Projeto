from fastapi import APIRouter, Depends, HTTPException, status

from banco import obter_sessao
from esquemas.ocorrencia import OcorrenciaCriar, OcorrenciaSaida
from rotas.autenticacao import GRUPO_ADMIN, GRUPO_EQUIPE, GRUPO_VISITANTE, exigir_grupo
from servicos.ocorrencia import listar_ocorrencias_do_aviso, registrar_ocorrencia
from servicos.usuario import obter_usuario_atual

# As ocorrências continuam subordinadas ao aviso nos caminhos utilizados pelo front.
router = APIRouter(prefix="/avisos", tags=["ocorrencias"])


# Distingue o aviso inexistente de um aviso que existe e ainda não possui ocorrências.
@router.get("/{aviso_id}/ocorrencias", response_model=list[OcorrenciaSaida], status_code=status.HTTP_200_OK)
def listar_ocorrencias_rotas(
    aviso_id: int,
    usuario=Depends(obter_usuario_atual),
    sessao=Depends(obter_sessao),
):
    dono_id = usuario.id if usuario.tipo == GRUPO_VISITANTE else None
    ocorrencias = listar_ocorrencias_do_aviso(sessao, aviso_id, dono_id)
    if ocorrencias is None:
        raise HTTPException(status_code=404, detail="Aviso não encontrado.")
    return ocorrencias


# A aula 6 mantém a recusa como texto; a rota escolhe o status com if, sem exceção própria.
@router.post("/{aviso_id}/ocorrencias", response_model=OcorrenciaSaida, status_code=status.HTTP_201_CREATED)
def criar_ocorrencia_rotas(
    aviso_id: int,
    dados: OcorrenciaCriar,
    # O administrador também opera o balcão; visitantes continuam sem essa permissão.
    usuario=Depends(exigir_grupo(GRUPO_EQUIPE, GRUPO_ADMIN)),
    sessao=Depends(obter_sessao),
):
    # NOVO: a equipe pode operar avisos de qualquer visitante; só o visitante teria filtro de dono.
    resultado = registrar_ocorrencia(sessao, aviso_id, dados.model_dump(), None)
    if resultado is None:
        raise HTTPException(status_code=404, detail="Aviso não encontrado.")
    if isinstance(resultado, str):
        raise HTTPException(status_code=422, detail=resultado)
    return resultado
