import re
import unicodedata


def calcado(descricao):
    """Identifica cor principal e um detalhe comparável sem confundir o cadarço com o calçado."""
    texto = unicodedata.normalize("NFKD", descricao.casefold())
    texto = "".join(letra for letra in texto if not unicodedata.combining(letra))
    if not re.search(r"\b(tenis|sapatos?|chinelos?|botas?|sandalias?)\b", texto):
        return None
    cores = r"pret[oa]|branc[oa]|azul|vermelh[oa]|verde|amarel[oa]|cinza|marrom|rosa|rox[oa]|bege"
    partes = re.split(r"\b(cadarcos?|sola)\b", texto, maxsplit=1)
    cor = re.search(rf"\b({cores})\b", partes[0])
    detalhe = re.search(rf"\b(cadarcos?|sola)\s+({cores})\b", texto)
    modelo = re.search(
        r"\bmodelo\s+([a-z0-9-]+(?:\s+(?!(?:com|no|na|de|tamanho|numero|cadarco|sola)\b)[a-z0-9-]+){0,2})",
        texto,
    )
    tamanho = re.search(r"\b(?:tamanho|numero|n[ºo])\s*(\d{2})\b", texto)
    detalhes = {}
    if detalhe:
        parte, valor = detalhe.groups()
        detalhes["cadarco" if parte.startswith("cadarco") else "sola"] = normalizar_cor(valor)
    if modelo and modelo[1] not in {"desconhecido", "ignorado", "nao sei", "nao informado"}:
        detalhes["modelo"] = modelo[1]
    if tamanho:
        detalhes["tamanho"] = tamanho[1]
    return normalizar_cor(cor[1]) if cor else None, detalhes


def normalizar_cor(cor):
    """Unifica as variantes de gênero usadas nas descrições."""
    return {"preta": "preto", "branca": "branco", "vermelha": "vermelho",
            "amarela": "amarelo", "roxa": "roxo"}.get(cor, cor)
