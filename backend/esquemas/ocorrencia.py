from pydantic import BaseModel, Field
from typing import Literal
from datetime import date

# O schema de ocorrência de entrada recebe o tipo e a descrição do achado ou da devolução.
class OcorrenciaCriar(BaseModel):
    tipo: Literal["objeto achado", "devolucao"]
    descricao: str = Field(..., min_length=3, max_length=200)

# A resposta da rota devolve o identificador, a data e o aviso ao qual pertence.
class OcorrenciaSaida(BaseModel):
    id: int
    aviso_id: int
    tipo: Literal["objeto achado", "devolucao"]
    descricao: str
    data: date  # O DATE do banco aparece como AAAA-MM-DD no JSON.
