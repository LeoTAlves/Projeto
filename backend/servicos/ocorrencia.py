from repositorios.ocorrencia import listar_ocorrencias_por_aviso
from repositorios.aviso import buscar_aviso_por_id

# O serviço de ocorrência faz apenas a regra de negócio e repassa o resultado para a rota.
def listar_ocorrencias_do_aviso(aviso_id):
    aviso = buscar_aviso_por_id(aviso_id)
    if aviso is None:
        return []
    return listar_ocorrencias_por_aviso(aviso_id)
