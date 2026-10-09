"""Exceções que dão nome às recusas das regras da cartilha."""


class VisitanteInvalido(Exception):
    """Indica que o usuário informado não existe ou não é visitante."""

    pass


class AvisoDevolvido(Exception):
    """Indica que um aviso já devolvido não aceita nova ocorrência."""

    pass
