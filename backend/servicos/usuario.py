import jwt
from fastapi import Depends, HTTPException, status

from banco import obter_sessao
from configuracao import obter_configuracao
from repositorios import usuario as repositorio_usuario
from segurança import gerar_hash
from segurança import verificar_senha
from seguranca import ler_token


configuracao = obter_configuracao()


def buscar_por_id(sessao, usuario_id):
    return repositorio_usuario.buscar_usuario_por_id(sessao, usuario_id)


def listar_usuarios(sessao):
    return repositorio_usuario.listar(sessao)


def autenticar(sessao, email, senha):
    usuario = repositorio_usuario.buscar_por_email(sessao, email)
    if usuario is None or not verificar_senha(senha, usuario.senha):
        return None
    return usuario


def obter_usuario_atual(
    token: str = Depends(ler_token),
    sessao=Depends(obter_sessao),
):
    credenciais_invalidas = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        dados = jwt.decode(
            token,
            configuracao["chave_do_token"],
            algorithms=["HS256"],
        )
        usuario_id = int(dados.get("sub"))
    except (jwt.InvalidTokenError, TypeError, ValueError):
        raise credenciais_invalidas

    usuario = buscar_por_id(sessao, usuario_id)
    if usuario is None:
        raise credenciais_invalidas
    return usuario


def criar_usuario(sessao, dados):
    usuario_existente = repositorio_usuario.buscar_por_email(sessao, dados["email"])
    if usuario_existente is not None:
        return "E-mail já cadastrado."

    dados_com_hash = {**dados, "senha": gerar_hash(dados["senha"])}
    return repositorio_usuario.salvar(sessao, dados_com_hash)
