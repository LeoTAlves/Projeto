from modelos.ocorrencia import Ocorrencia


# Um único commit grava a ocorrência e a situação do aviso alterada na mesma sessão.
def criar_ocorrencia(sessao, aviso_id, dados):
    ocorrencia = Ocorrencia(aviso_id=aviso_id, **dados)
    sessao.add(ocorrencia)
    sessao.commit()
    sessao.refresh(ocorrencia)
    return ocorrencia
