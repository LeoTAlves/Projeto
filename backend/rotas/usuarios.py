from fastapi import APIRouter, Depends, HTTPException, status

from banco import obter_sessao
from esquemas.usuario import UsuarioCadastro, UsuarioCriar, UsuarioSaida
from rotas.autenticacao import GRUPO_EQUIPE, exigir_grupo
from servicos.usuario import criar_usuario, listar_usuarios, obter_usuario_atual


router = APIRouter(prefix="/usuarios", tags=["usuarios"])


@router.get("/eu", response_model=UsuarioSaida, status_code=status.HTTP_200_OK)
def mostrar_usuario_atual(usuario=Depends(obter_usuario_atual)):
    return usuario


@router.get("", response_model=list[UsuarioSaida], status_code=status.HTTP_200_OK)
def listar_usuarios_rota(
    usuario=Depends(exigir_grupo(GRUPO_EQUIPE)),
    sessao=Depends(obter_sessao),
):
    return listar_usuarios(sessao)


@router.post("/cadastro", response_model=UsuarioSaida, status_code=status.HTTP_201_CREATED)
def cadastrar_usuario_rota(dados: UsuarioCadastro, sessao=Depends(obter_sessao)):
    usuario = criar_usuario(sessao, {**dados.model_dump(), "tipo": "visitante"})
    if isinstance(usuario, str):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=usuario)
    return usuario


@router.post("", response_model=UsuarioSaida, status_code=status.HTTP_201_CREATED)
def criar_usuario_rota(
    dados: UsuarioCriar,
    usuario=Depends(exigir_grupo(GRUPO_EQUIPE)),
    sessao=Depends(obter_sessao),
):
    usuario = criar_usuario(sessao, dados.model_dump())
    if isinstance(usuario, str):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=usuario)
    return usuario
