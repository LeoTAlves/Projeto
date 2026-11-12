import re
import unicodedata

from esquemas.aviso import AtributosObjeto


TIPOS = {
    "Celulares e eletrônicos": {"celular", "smartphone", "tablet", "fone", "notebook", "carregador"},
    "Carteiras e documentos": {"carteira", "documento", "passaporte", "cnh", "rg", "cartao"},
    "Chaves": {"chave", "chaves", "chaveiro"},
    "Óculos": {"oculos"},
    "Bolsas e mochilas": {"bolsa", "mochila", "mala", "pochete"},
    "Roupas e acessórios": {"camisa", "camiseta", "jaqueta", "bone", "relogio", "casaco"},
}
CORES = {
    "preto": {"preto", "preta", "negro", "negra"},
    "branco": {"branco", "branca"},
    "azul": {"azul"},
    "vermelho": {"vermelho", "vermelha"},
    "verde": {"verde"},
    "amarelo": {"amarelo", "amarela"},
    "cinza": {"cinza"},
    "marrom": {"marrom"},
    "rosa": {"rosa"},
    "roxo": {"roxo", "roxa"},
}
MARCAS = ("Samsung", "Apple", "Motorola", "Xiaomi", "Nike", "Adidas", "JBL", "Sony", "Dell", "Lenovo")
SINONIMOS = {"smartphone": "celular", "dourada": "amarela", "dourado": "amarelo", "oculos": "oculos"}


def palavras(texto):
    texto = unicodedata.normalize("NFKD", (texto or "").casefold())
    texto = "".join(letra for letra in texto if not unicodedata.combining(letra))
    return set(re.findall(r"[a-z0-9]{2,}", texto))


def extrair_atributos(descricao):
    termos = palavras(descricao)
    categorias = [nome for nome, exemplos in TIPOS.items() if termos & exemplos]
    cores = [nome for nome, exemplos in CORES.items() if termos & exemplos]
    marcas = [marca for marca in MARCAS if palavras(marca) <= termos]
    return AtributosObjeto(
        categoria=categorias[0] if len(categorias) == 1 else None,
        cor=cores[0] if len(cores) == 1 else None,
        marca=marcas[0] if len(marcas) == 1 else None,
    )


def comparar_localmente(objeto, avisos):
    origem = objeto.get("caracteristicas_distintivas") or ""
    termos = {SINONIMOS.get(t, t) for t in palavras(origem)} - {"com", "uma", "meu", "minha"}
    resultado = []
    for aviso in avisos:
        extraidos = extrair_atributos(aviso.descricao).model_dump()
        compativeis = []
        for campo in ("categoria", "cor", "marca"):
            valor = getattr(aviso, campo, None) or extraidos[campo]
            if valor and objeto.get(campo) and palavras(valor) == palavras(objeto[campo]):
                compativeis.append(campo)
        outros = {SINONIMOS.get(t, t) for t in palavras(aviso.descricao)}
        comuns = termos & outros
        if comuns:
            compativeis.append("caracteristicas_distintivas")
        if len(compativeis) < 3:
            continue
        peso = len(compativeis) * 2 + ("marca" in compativeis) * 2
        resultado.append({
            "aviso_id": aviso.id, "pontuacao": min(peso, 10),
            "caracteristicas_compativeis": compativeis,
            "explicacao": "Comparação local. Em comum: " + ", ".join(sorted(comuns))[:420],
            "situacao": aviso.situacao, "bloqueado": False,
        })
    return sorted(resultado, key=lambda item: (-item["pontuacao"], item["aviso_id"]))
