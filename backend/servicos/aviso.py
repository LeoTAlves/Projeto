from repositorios import aviso as repositorio_aviso


# O serviço repassa os filtros; o repositório monta a consulta paginada no banco.
def listar_avisos(sessao, pavilhao=None, visitante_id=None, pagina=1):
    return repositorio_aviso.listar_avisos(sessao, pavilhao, visitante_id, pagina)


# A rota decide o 404 quando o repositório não encontra o aviso.
def buscar_aviso(sessao, aviso_id, usuario_id):
    return repositorio_aviso.buscar_aviso_por_id(sessao, aviso_id, usuario_id)


# A cartilha vincula a perda a um visitante e define procurando como situação inicial.
def criar_aviso(sessao, dados, usuario):
    if usuario.tipo != "visitante":
        return "O aviso de perda deve pertencer a um visitante."
    dados_do_aviso = {
        **dados,
        "situacao": "procurando",
        "visitante_id": usuario.id,
    }
    return repositorio_aviso.criar_aviso(sessao, dados_do_aviso)
