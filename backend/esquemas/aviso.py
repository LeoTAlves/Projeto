from typing import Literal
from pydantic import BaseModel, Field

from esquemas.ocorrencia import OcorrenciaSaida

# Este schema define a entrada do aviso novo para a pessoa visitante, sem senha e sem autenticação.
class AvisoCriar(BaseModel):
    descricao: str = Field(..., min_length=3, max_length=200)
    pavilhao: Literal["Pavilhao 1", "Pavilhao 2", "Pavilhao 3"]
    noite: str = Field(..., min_length=4, max_length=20)
    visitante_id: int = Field(..., ge=1)

# O schema de saída traz os dados principais do aviso e o estado atual da busca.
class AvisoSaida(BaseModel):
    id: int
    descricao: str
    pavilhao: str
    noite: str
    visitante_id: int
    situacao: Literal["procurando", "aguardando retirada", "devolvido"]

# O detalhe agrega ocorrências já definidas no esquema do próprio recurso de ocorrências.
class AvisoDetalhe(AvisoSaida):
    ocorrencias: list[OcorrenciaSaida] = Field(default_factory=list)
