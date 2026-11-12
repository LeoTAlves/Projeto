import jwt
from fastapi import Depends, HTTPException, status

from banco import obter_sessao
from configuracao import obter_configuracao
from repositorios import usuario as repositorio_usuario
from seguranca import gerar_hash, ler_token, verificar_senha
from servicos.acesso import enviar_confirmacao


configuracao = obter_configuracao()


def buscar_por_id(sessao, usuario_id):
    return repositorio_usuario.buscar_usuario_por_id(sessao, usuario_id)


def listar_usuarios(sessao):
    return repositorio_usuario.listar(sessao)


def autenticar(sessao, email, senha):
    email_normalizado = (email or "").strip().lower()
    usuario = repositorio_usuario.buscar_por_email(sessao, email_normalizado)
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
        if "finalidade" in dados:
            raise credenciais_invalidas
    except (jwt.InvalidTokenError, TypeError, ValueError):
        raise credenciais_invalidas

    usuario = buscar_por_id(sessao, usuario_id)
    if usuario is None or not usuario.email_confirmado:
        raise credenciais_invalidas
    return usuario


def criar_usuario(sessao, dados, confirmar_cadastro=False):
    dados = {**dados, "email": (dados.get("email") or "").strip().lower()}
    usuario_existente = repositorio_usuario.buscar_por_email(sessao, dados["email"])
    if usuario_existente is not None:
        return "E-mail já cadastrado."

    dados_com_hash = {**dados, "senha": gerar_hash(dados["senha"])}
    if confirmar_cadastro:
        return repositorio_usuario.salvar(
            sessao, {**dados_com_hash, "email_confirmado": False}, enviar_confirmacao,
        )
    return repositorio_usuario.salvar(sessao, dados_com_hash)
