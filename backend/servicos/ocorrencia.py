from datetime import date
from hmac import compare_digest

from repositorios import aviso as repositorio_aviso
from repositorios import ocorrencia as repositorio_ocorrencia
from seguranca import gerar_codigo_retirada


# A sessão continua aberta enquanto relationship consulta as ocorrências do aviso.
def listar_ocorrencias_do_aviso(sessao, aviso_id, usuario_id):
    aviso = repositorio_aviso.buscar_aviso_por_id(sessao, aviso_id, usuario_id)
    if aviso is None:
        return None
    return aviso.ocorrencias


# A regra altera o objeto acompanhado pela sessão e salva tudo no commit da ocorrência.
def registrar_ocorrencia(sessao, aviso_id, dados, usuario_id):
    aviso = repositorio_aviso.bloquear_aviso(sessao, aviso_id)
    if aviso is None or (usuario_id is not None and aviso.visitante_id != usuario_id):
        return None
    if aviso.situacao == "devolvido":
        return "Aviso já devolvido. Não é possível registrar nova ocorrência."
    if aviso.situacao == "triado":
        return "Este registro foi triado. Use o aviso de perda do visitante."

    if dados["tipo"] == "objeto achado":
        aviso.situacao = "aguardando retirada"
    elif dados["tipo"] == "devolucao":
        if aviso.situacao != "aguardando retirada":
            return "Registre o achado antes de devolver o objeto."
        if aviso.visitante_id is None:
            return "Vincule o visitante ao aviso antes da devolução."
        codigo = (dados.get("codigo_retirada") or "").strip().upper().replace("-", "")
        esperado = gerar_codigo_retirada(aviso.id, aviso.visitante_id).replace("-", "")
        if not codigo.isascii() or not compare_digest(codigo, esperado):
            return "Código de retirada inválido. Peça o código ao visitante."
        aviso.situacao = "devolvido"

    # Nenhum commit acontece entre a mudança acima e a inclusão da ocorrência.
    ocorrencia = {"tipo": dados["tipo"], "descricao": dados["descricao"], "data": date.today()}
    return repositorio_ocorrencia.criar_ocorrencia(sessao, aviso_id, ocorrencia)
