from repositorios import usuario as repositorio_usuario
from segurança import gerar_hash


def buscar_por_id(sessao, usuario_id):
    return repositorio_usuario.buscar_usuario_por_id(sessao, usuario_id)


def listar_usuarios(sessao):
    return repositorio_usuario.listar(sessao)


def criar_usuario(sessao, dados):
    usuario_existente = repositorio_usuario.buscar_por_email(sessao, dados["email"])
    if usuario_existente is not None:
        return "E-mail já cadastrado."

    dados_com_hash = {**dados, "senha": gerar_hash(dados["senha"])}
    return repositorio_usuario.salvar(sessao, dados_com_hash)
