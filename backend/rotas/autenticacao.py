from fastapi import APIRouter, Depends, HTTPException, Response, status

from banco import obter_sessao
from esquemas.usuario import Login, Token
from servicos.acesso import login_seguro
from servicos.usuario import obter_usuario_atual


router = APIRouter(tags=["autenticacao"])


GRUPO_VISITANTE = "visitante"
GRUPO_EQUIPE = "equipe"
GRUPO_ADMIN = "admin"


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


@router.post("/login", response_model=Token, response_model_exclude_none=True)
def login(
    dados: Login,
    resposta: Response,
    sessao=Depends(obter_sessao),
):
    resposta.headers["Cache-Control"] = "no-store"
    return login_seguro(sessao, dados)
