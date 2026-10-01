# O repositório de ocorrências também fica em memória, como manda a cartilha da aula 5.
ocorrencias = [
    {
        "id": 1,
        "aviso_id": 1,
        "tipo": "objeto achado",
        "descricao": "Óculos com armação cinza e caixa de celular ao lado",
        "data": "2026-10-10",
    },
    {
        "id": 2,
        "aviso_id": 2,
        "tipo": "objeto achado",
        "descricao": "Carteira com cartões e documento pendurados na fila",
        "data": "2026-10-11",
    },
    {
        "id": 3,
        "aviso_id": 3,
        "tipo": "devolucao",
        "descricao": "Bolsa devolvida ao balcão pela equipe",
        "data": "2026-10-12",
    },
]

# Lista as ocorrências por aviso para a tela do visitante e da gestão.
def listar_ocorrencias_por_aviso(aviso_id):
    resultado = []
    for ocorrencia in ocorrencias:
        if ocorrencia["aviso_id"] == aviso_id:
            resultado.append(ocorrencia)
    return resultado

# Salva a nova ocorrência e devolve o registro completo para a rota responder 201.
def criar_ocorrencia(aviso_id, dados):
    proximo_id = 1
    for ocorrencia in ocorrencias:
        if ocorrencia["id"] >= proximo_id:
            proximo_id = ocorrencia["id"] + 1

    nova_ocorrencia = {
        "id": proximo_id,
        "aviso_id": aviso_id,
        "tipo": dados["tipo"],
        "descricao": dados["descricao"],
        "data": dados["data"],
    }
    ocorrencias.append(nova_ocorrencia)
    return nova_ocorrencia
