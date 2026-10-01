# Este repositório guarda a lista em memória de avisos e expõe as operações simples de leitura e gravação.
avisos = [
    {
        "id": 1,
        "descricao": "Óculos de grau preto",
        "pavilhao": "Pavilhao 1",
        "noite": "2026-10-10",
        "visitante_id": 1,
        "situacao": "procurando",
    },
    {
        "id": 2,
        "descricao": "Carteira azul com chaves",
        "pavilhao": "Pavilhao 2",
        "noite": "2026-10-11",
        "visitante_id": 2,
        "situacao": "aguardando retirada",
    },
    {
        "id": 3,
        "descricao": "Bolsa pequena marrom",
        "pavilhao": "Pavilhao 3",
        "noite": "2026-10-12",
        "visitante_id": 1,
        "situacao": "devolvido",
    },
]

# A função de busca retorna o aviso por id, porque a rota precisa validar se a busca existe antes de abrir detalhes.
def buscar_aviso_por_id(aviso_id):
    for aviso in avisos:
        if aviso["id"] == aviso_id:
            return aviso
    return None

# A listagem usa filtros opcionais para a tela do balcão e para a visão do visitante.
def listar_avisos(pavilhao=None, visitante_id=None):
    resultado = []
    for aviso in avisos:
        if pavilhao is not None and aviso["pavilhao"] != pavilhao:
            continue
        if visitante_id is not None and aviso["visitante_id"] != visitante_id:
            continue
        resultado.append(aviso)
    return resultado

# Cria o aviso novo com o próximo id disponível, preservando a regra inicial do status.
def criar_aviso(dados):
    proximo_id = 1
    for aviso in avisos:
        if aviso["id"] >= proximo_id:
            proximo_id = aviso["id"] + 1

    novo_aviso = {
        "id": proximo_id,
        "descricao": dados["descricao"],
        "pavilhao": dados["pavilhao"],
        "noite": dados["noite"],
        "visitante_id": dados["visitante_id"],
        "situacao": "procurando",
    }
    avisos.append(novo_aviso)
    return novo_aviso

