from datetime import date

from repositorios import aviso as repositorio_aviso
from repositorios import ocorrencia as repositorio_ocorrencia

# A camada de serviço cuida da regra do negócio e decide o estado do aviso conforme a ocorrência.
def listar_avisos(pavilhao=None, visitante_id=None):
    return repositorio_aviso.listar_avisos(pavilhao=pavilhao, visitante_id=visitante_id)

# Busca um aviso e prepara o retorno com ocorrências para a rota abrir a tela de detalhe.
def buscar_aviso(aviso_id):
    aviso = repositorio_aviso.buscar_aviso_por_id(aviso_id)
    if aviso is None:
        return None

    return {
        "id": aviso["id"],
        "descricao": aviso["descricao"],
        "pavilhao": aviso["pavilhao"],
        "noite": aviso["noite"],
        "visitante_id": aviso["visitante_id"],
        "situacao": aviso["situacao"],
        "ocorrencias": repositorio_ocorrencia.listar_ocorrencias_por_aviso(aviso_id),
    }

# Cria o aviso novo e mantém o estado inicial em procurando, como determina a cartilha.
def criar_aviso(dados):
    return repositorio_aviso.criar_aviso(dados)

# Mostra as ocorrências do aviso e devolve a lista para a rota exibir o histórico.
def listar_ocorrencias_do_aviso(aviso_id):
    return repositorio_ocorrencia.listar_ocorrencias_por_aviso(aviso_id)

# Registra uma nova ocorrência e atualiza a situação do aviso conforme o tipo da ocorrência.
def registrar_ocorrencia(aviso_id, dados):
    aviso = repositorio_aviso.buscar_aviso_por_id(aviso_id)
    if aviso is None:
        return None

    if aviso["situacao"] == "devolvido":
        return "Aviso já devolvido. Não é possível registrar nova ocorrência."

    ocorrencia = {
        "tipo": dados["tipo"],
        "descricao": dados["descricao"],
        "data": str(date.today()),
    }

    nova_ocorrencia = repositorio_ocorrencia.criar_ocorrencia(aviso_id, ocorrencia)

    if dados["tipo"] == "objeto achado":
        aviso["situacao"] = "aguardando retirada"
    elif dados["tipo"] == "devolucao":
        aviso["situacao"] = "devolvido"

    return nova_ocorrencia
