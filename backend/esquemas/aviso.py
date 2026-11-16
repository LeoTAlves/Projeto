from datetime import date, datetime
from typing import Annotated, Literal
from pydantic import BaseModel, Field, StringConstraints, model_validator

from esquemas.ocorrencia import OcorrenciaSaida
from ia.calcados import calcado

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
    categoria: CategoriaObjeto
    cor: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
    marca: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
    pavilhao: Literal["Pavilhao 1", "Pavilhao 2", "Pavilhao 3"]
    noite: date  # Valida uma data real, mantendo AAAA-MM-DD no JSON.
    local_guarda: str | None = Field(default=None, max_length=100)

    @model_validator(mode="after")
    def validar_detalhes(self):
        # Também vale para o cadastro do balcão, que herda este esquema.
        dados = calcado(self.descricao)
        if dados is not None and not all(dados):
            raise ValueError("Informe na descrição a cor do calçado e a cor do cadarço ou da sola, o modelo ou o tamanho.")
        return self


# O balcão usa os mesmos dados mínimos para comparar um achado com a perda.
class ObjetoBalcaoCriar(AvisoCriar):
    descricao: Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=200)]

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
    atendimentos_vinculados: list[AvisoSaida] = Field(default_factory=list)


class VinculoVisitante(BaseModel):
    visitante_id: int = Field(gt=0)


class CodigoRetirada(BaseModel):
    codigo: str = Field(pattern=r"^[0-9]{6}$")


# A equipe pode informar ou limpar o local após salvar o achado.
class LocalGuarda(BaseModel):
    local_guarda: Annotated[str, StringConstraints(strip_whitespace=True, max_length=100)]


class CorrespondenciaTriagem(AvisoSaida):
    termos_em_comum: list[str]


class ConfirmacaoTriagem(BaseModel):
    aviso_ids: list[int] = Field(min_length=1, max_length=100)
