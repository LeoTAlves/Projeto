from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from banco import obter_sessao
from esquemas.aviso import AvisoCriar, AvisoDetalhe, AvisoSaida, CodigoRetirada, ConfirmacaoTriagem, CorrespondenciaTriagem, VinculoVisitante
from rotas.autenticacao import GRUPO_ADMIN, GRUPO_EQUIPE, GRUPO_VISITANTE, exigir_grupo
from seguranca import gerar_codigo_retirada
from servicos.aviso import buscar_aviso, confirmar_triagem, criar_aviso as criar_aviso_servico, listar_avisos, registrar_objeto_no_balcao, triar_objeto, vincular_visitante
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


# A equipe recebe objetos que ainda não têm um aviso de visitante.
@router.post("/balcao", response_model=AvisoSaida, status_code=201)
def registrar_objeto_balcao(
    dados: AvisoCriar,
    usuario=Depends(exigir_grupo(GRUPO_EQUIPE, GRUPO_ADMIN)),
    sessao=Depends(obter_sessao),
):
    return registrar_objeto_no_balcao(sessao, dados.model_dump())


# A equipe analisa sugestões antes de confirmar o vínculo com um visitante.
@router.get("/{aviso_id}/triagem", response_model=list[CorrespondenciaTriagem])
def consultar_triagem(
    aviso_id: int,
    busca: str | None = Query(default=None, max_length=200),
    usuario=Depends(exigir_grupo(GRUPO_EQUIPE, GRUPO_ADMIN)),
    sessao=Depends(obter_sessao),
):
    achado = buscar_aviso(sessao, aviso_id, None)
    if achado is None:
        raise HTTPException(status_code=404, detail="Aviso não encontrado.")
    if achado.situacao != "aguardando retirada" or achado.visitante_id is not None:
        raise HTTPException(status_code=422, detail="Selecione um objeto encontrado sem visitante vinculado.")
    return [
        CorrespondenciaTriagem(**AvisoSaida.model_validate(perda, from_attributes=True).model_dump(), termos_em_comum=termos)
        for perda, termos in triar_objeto(sessao, achado, busca)
    ]


# A equipe associa o aviso ao visitante depois de conferir a identificação do objeto.
@router.post("/{aviso_id}/triagem", response_model=list[AvisoSaida])
def registrar_triagem(
    aviso_id: int,
    dados: ConfirmacaoTriagem,
    usuario=Depends(exigir_grupo(GRUPO_EQUIPE, GRUPO_ADMIN)),
    sessao=Depends(obter_sessao),
):
    resultado = confirmar_triagem(sessao, aviso_id, dados.aviso_ids)
    if resultado is None:
        raise HTTPException(status_code=404, detail="Objeto não encontrado.")
    if isinstance(resultado, str):
        raise HTTPException(status_code=409, detail=resultado)
    return resultado


# A equipe associa o aviso ao visitante depois de conferir a identificação do objeto.
@router.patch("/{aviso_id}/visitante", response_model=AvisoSaida)
def vincular_dono(
    aviso_id: int,
    dados: VinculoVisitante,
    usuario=Depends(exigir_grupo(GRUPO_EQUIPE, GRUPO_ADMIN)),
    sessao=Depends(obter_sessao),
):
    aviso = vincular_visitante(sessao, aviso_id, dados.visitante_id)
    if aviso is None:
        raise HTTPException(status_code=404, detail="Aviso não encontrado.")
    if isinstance(aviso, str):
        raise HTTPException(status_code=422, detail=aviso)
    return aviso


# Só o visitante dono recebe o código, e apenas enquanto o objeto aguarda retirada.
@router.get("/{aviso_id}/codigo-retirada", response_model=CodigoRetirada)
def consultar_codigo_retirada(
    aviso_id: int,
    resposta: Response,
    usuario=Depends(exigir_grupo(GRUPO_VISITANTE)),
    sessao=Depends(obter_sessao),
):
    aviso = buscar_aviso(sessao, aviso_id, usuario.id)
    if aviso is None or aviso.situacao != "aguardando retirada":
        raise HTTPException(status_code=404, detail="Código de retirada indisponível.")
    resposta.headers["Cache-Control"] = "private, no-store"
    return {"codigo": gerar_codigo_retirada(aviso.id, usuario.id)}


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
