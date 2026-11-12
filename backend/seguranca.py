from datetime import datetime, timedelta, timezone
from hashlib import sha256
from hmac import new as hmac_novo

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


# A sessão identifica o usuário e expira em uma hora.
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


# O segredo do servidor vincula o código ao aviso e ao dono sem gravar o código no banco.
def gerar_codigo_retirada(aviso):
    # O timestamp mantém elegíveis os achados antigos que ficaram pendentes de aprovação.
    vinculo = aviso.nonce_retirada or aviso.situacao_desde
    mensagem = f"cade:retirada:v3:{aviso.id}:{aviso.visitante_id}:{vinculo}".encode()
    chave = configuracao["chave_do_token"].encode()
    digest = hmac_novo(chave, mensagem, sha256).digest()
    return f"{int.from_bytes(digest, 'big') % 1_000_000:06d}"
