from datetime import date
from typing import Literal

from pydantic import BaseModel, Field


Caracteristica = Literal[
    "categoria",
    "cor",
    "marca",
    "modelo",
    "caracteristicas_distintivas",
]


class SugestaoIACriar(BaseModel):
    categoria: str | None = Field(default=None, max_length=100)
    cor: str | None = Field(default=None, max_length=100)
    marca: str | None = Field(default=None, max_length=100)
    modelo: str | None = Field(default=None, max_length=100)
    caracteristicas_distintivas: str | None = Field(default=None, max_length=500)
    pavilhao: str | None = Field(default=None, max_length=50)
    turno: str | None = Field(default=None, max_length=50)
    noite: date | None = None


class CorrespondenciaIA(BaseModel):
    aviso_id: int = Field(gt=0)
    pontuacao: int = Field(ge=0, le=10)
    caracteristicas_compativeis: list[Caracteristica] = Field(min_length=3, max_length=5)
    explicacao: str = Field(min_length=1, max_length=500)


class CorrespondenciaIAResposta(CorrespondenciaIA):
    situacao: Literal["procurando", "aguardando retirada", "devolvido", "triado"]
    bloqueado: bool


class SugestaoIAResposta(BaseModel):
    situacao: Literal["sugerida", "informacoes_insuficientes", "sem_correspondencias"]
    mensagem: str = Field(min_length=1, max_length=500)
    correspondencias: list[CorrespondenciaIAResposta] = Field(default_factory=list)


class SugestaoIAModelo(BaseModel):
    mensagem: str = Field(min_length=1, max_length=500)
    correspondencias: list[CorrespondenciaIA] = Field(default_factory=list)
