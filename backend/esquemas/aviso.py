from datetime import date, datetime
from typing import Annotated, Literal
from pydantic import BaseModel, Field, StringConstraints

from esquemas.ocorrencia import OcorrenciaSaida

CategoriaObjeto = Literal[
    "Celulares e eletrônicos", "Carteiras e documentos", "Chaves", "Óculos",
    "Bolsas e mochilas", "Roupas e acessórios", "Outros",
]


class AtributosObjeto(BaseModel):
    categoria: CategoriaObjeto | None = None
    cor: str | None = Field(default=None, max_length=100)
    marca: str | None = Field(default=None, max_length=100)


class DescricaoObjeto(BaseModel):
    descricao: str = Field(min_length=3, max_length=200)

# Este schema define a entrada do aviso novo para a pessoa visitante, sem senha e sem autenticação.
class AvisoCriar(AtributosObjeto):
    descricao: str = Field(..., min_length=3, max_length=200)
    pavilhao: Literal["Pavilhao 1", "Pavilhao 2", "Pavilhao 3"]
    noite: date  # Valida uma data real, mantendo AAAA-MM-DD no JSON.
    local_guarda: str | None = Field(default=None, max_length=100)


# O balcão pode registrar só a descrição. Clientes anteriores ainda podem enviar os demais dados.
class ObjetoBalcaoCriar(AvisoCriar):
    descricao: Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=200)]
    pavilhao: Literal["Pavilhao 1", "Pavilhao 2", "Pavilhao 3"] | None = None
    noite: date | None = None

# O schema de saída traz os dados principais do aviso e o estado atual da busca.
class AvisoSaida(AtributosObjeto):
    id: int
    descricao: str
    pavilhao: str
    noite: date
    visitante_id: int | None
    situacao: Literal["procurando", "aguardando retirada", "devolvido", "triado", "cancelado"]
    local_guarda: str | None = None
    recebido_por: str | None = None
    aviso_vinculado_id: int | None = None
    origem_achado_id: int | None = None
    situacao_desde: datetime | None = None


# O detalhe agrega ocorrências já definidas no esquema do próprio recurso de ocorrências.
class AvisoDetalhe(AvisoSaida):
    ocorrencias: list[OcorrenciaSaida] = Field(default_factory=list)


class VinculoVisitante(BaseModel):
    visitante_id: int = Field(gt=0)


class CodigoRetirada(BaseModel):
    codigo: str = Field(pattern=r"^[0-9]{6}$")


class CorrespondenciaTriagem(AvisoSaida):
    termos_em_comum: list[str]


class ConfirmacaoTriagem(BaseModel):
    aviso_ids: list[int] = Field(min_length=1, max_length=100)
