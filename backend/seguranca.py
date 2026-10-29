from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from pwdlib import PasswordHash

from configuracao import obter_configuracao


configuracao = obter_configuracao()
esquema_oauth = OAuth2PasswordBearer(tokenUrl="/login")

hasher = PasswordHash.recommended()


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


def gerar_hash(senha: str):
    return hasher.hash(senha)


def verificar_senha(senha: str, senha_hash: str):
    return hasher.verify(senha, senha_hash)
