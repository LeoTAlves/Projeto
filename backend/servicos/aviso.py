from repositorios import aviso as repositorio_aviso
from repositorios import usuario as repositorio_usuario


# O serviço repassa os filtros; o repositório monta a consulta paginada no banco.
def listar_avisos(sessao, pavilhao=None, visitante_id=None, pagina=1):
    return repositorio_aviso.listar_avisos(sessao, pavilhao, visitante_id, pagina)


# A rota decide o 404 quando o repositório não encontra o aviso.
def buscar_aviso(sessao, aviso_id):
    return repositorio_aviso.buscar_aviso_por_id(sessao, aviso_id)


# A cartilha vincula a perda a um visitante e define procurando como situação inicial.
def criar_aviso(sessao, dados):
    visitante = repositorio_usuario.buscar_usuario_por_id(sessao, dados["visitante_id"])
    if visitante is None:
        return "Visitante não encontrado. Cadastre o usuário antes de registrar a perda."
    if visitante.tipo != "visitante":
        return "O aviso de perda deve pertencer a um visitante."
    return repositorio_aviso.criar_aviso(sessao, {**dados, "situacao": "procurando"})
