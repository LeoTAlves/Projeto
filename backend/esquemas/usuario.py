from typing import Literal

from pydantic import BaseModel, Field


TipoUsuario = Literal["visitante", "equipe"]


# O esquema de entrada reúne os dados necessários para cadastrar um usuário.
class UsuarioCriar(BaseModel):
    nome: str = Field(..., min_length=3, max_length=100)
    tipo: TipoUsuario
    email: str = Field(..., min_length=5, max_length=100)
    senha: str = Field(..., min_length=8, max_length=100)


# A senha nunca volta na resposta da API.
class UsuarioSaida(BaseModel):
    id: int
    nome: str
    tipo: TipoUsuario
    email: str
