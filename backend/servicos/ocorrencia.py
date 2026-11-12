from datetime import datetime, timezone
from hmac import compare_digest
from secrets import token_hex

from repositorios import aviso as repositorio_aviso
from repositorios import ocorrencia as repositorio_ocorrencia
from seguranca import gerar_codigo_retirada
from servicos.aviso import mudar_situacao


# A sessão continua aberta enquanto relationship consulta as ocorrências do aviso.
def listar_ocorrencias_do_aviso(sessao, aviso_id, usuario_id):
    aviso = repositorio_aviso.buscar_aviso_por_id(sessao, aviso_id, usuario_id)
    if aviso is None:
        return None
    return aviso.ocorrencias


# A regra altera o objeto acompanhado pela sessão e salva tudo no commit da ocorrência.
def registrar_ocorrencia(sessao, aviso_id, dados, usuario_id, atendente):
    aviso = repositorio_aviso.bloquear_aviso(sessao, aviso_id)
    if aviso is None or (usuario_id is not None and aviso.visitante_id != usuario_id):
        return None
    if aviso.situacao == "devolvido":
        return "Aviso já devolvido. Não é possível registrar nova ocorrência."
    if aviso.situacao == "triado":
        return "Este registro foi triado. Use o aviso de perda do visitante."
    if aviso.situacao == "cancelado":
        return "O visitante cancelou este aviso."

    if dados["tipo"] == "objeto achado":
        if aviso.situacao != "procurando":
            return "O aviso já tem um achado registrado."
        mudar_situacao(aviso, "aguardando retirada")
        aviso.nonce_retirada = token_hex(32)
    elif dados["tipo"] == "devolucao":
        if aviso.situacao != "aguardando retirada":
            return "Registre o achado antes de devolver o objeto."
        if aviso.visitante_id is None:
            return "Vincule o visitante ao aviso antes da devolução."
        codigo = (dados.get("codigo_retirada") or "").strip()
        esperado = gerar_codigo_retirada(aviso)
        if not codigo.isascii() or not compare_digest(codigo, esperado):
            return "Código de retirada inválido. Peça o código ao visitante."
        mudar_situacao(aviso, "devolvido")
        aviso.nonce_retirada = None

    # Nenhum commit acontece entre a mudança acima e a inclusão da ocorrência.
    agora = datetime.now(timezone.utc)
    ocorrencia = {
        "tipo": dados["tipo"], "descricao": dados["descricao"], "data": agora.date(),
        "atendente": f"#{atendente.id} {atendente.nome}"[:100], "registrada_em": agora,
    }
    return repositorio_ocorrencia.criar_ocorrencia(sessao, aviso_id, ocorrencia)
