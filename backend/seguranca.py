from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer

from configuracao import obter_configuracao


configuracao = obter_configuracao()
esquema_oauth = OAuth2PasswordBearer(tokenUrl="login")


def ler_token(token: str = Depends(esquema_oauth)):
    return token


def criar_token(usuario_id: int):
    validade = datetime.now(timezone.utc) + timedelta(minutes=60)
    dados = {"sub": str(usuario_id), "exp": validade}
    return jwt.encode(
        dados,
        configuracao["chave_do_token"],
        algorithm="HS256",
    )
