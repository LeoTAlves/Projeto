from datetime import date

from repositorios import aviso as repositorio_aviso
from repositorios import ocorrencia as repositorio_ocorrencia


# A sessão continua aberta enquanto relationship consulta as ocorrências do aviso.
def listar_ocorrencias_do_aviso(sessao, aviso_id):
    aviso = repositorio_aviso.buscar_aviso_por_id(sessao, aviso_id)
    if aviso is None:
        return None
    return aviso.ocorrencias


# A regra altera o objeto acompanhado pela sessão e salva tudo no commit da ocorrência.
def registrar_ocorrencia(sessao, aviso_id, dados):
    aviso = repositorio_aviso.buscar_aviso_por_id(sessao, aviso_id)
    if aviso is None:
        return None
    if aviso.situacao == "devolvido":
        return "Aviso já devolvido. Não é possível registrar nova ocorrência."

    if dados["tipo"] == "objeto achado":
        aviso.situacao = "aguardando retirada"
    elif dados["tipo"] == "devolucao":
        aviso.situacao = "devolvido"

    # Nenhum commit acontece entre a mudança acima e a inclusão da ocorrência.
    ocorrencia = {**dados, "data": date.today()}
    return repositorio_ocorrencia.criar_ocorrencia(sessao, aviso_id, ocorrencia)
