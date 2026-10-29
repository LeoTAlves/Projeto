from fastapi import APIRouter, Depends, HTTPException, status

from banco import obter_sessao
from esquemas.usuario import Login, Token
from seguranca import criar_token
from servicos.usuario import autenticar, obter_usuario_atual


router = APIRouter(tags=["autenticacao"])


GRUPO_VISITANTE = "visitante"
GRUPO_EQUIPE = "equipe"


def exigir_grupo(*grupos_permitidos):
    grupos = tuple(grupos_permitidos)
    if not grupos:
        raise ValueError("Informe ao menos um grupo permitido.")

    def conferir_grupo(usuario=Depends(obter_usuario_atual)):
        if usuario.tipo not in grupos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Seu grupo não tem permissão para acessar este recurso.",
            )
        return usuario

    return conferir_grupo


@router.post("/login", response_model=Token)
def login(
    dados: Login,
    sessao=Depends(obter_sessao),
):
    usuario = autenticar(sessao, dados.email, dados.senha)
    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos",
        )
    return {"access_token": criar_token(usuario.id), "token_type": "bearer"}
