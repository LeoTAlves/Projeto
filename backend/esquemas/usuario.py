from typing import Literal

from pydantic import BaseModel, EmailStr, Field


TipoUsuario = Literal["visitante", "equipe"]


# O esquema de entrada reúne os dados necessários para cadastrar um usuário.
class UsuarioCriar(BaseModel):
    nome: str = Field(..., min_length=3, max_length=100)
    tipo: TipoUsuario
    email: str = Field(..., min_length=5, max_length=100)
    senha: str = Field(..., min_length=8, max_length=100)


class UsuarioCadastro(BaseModel):
    nome: str = Field(..., min_length=3, max_length=100)
    email: EmailStr = Field(..., max_length=100)
    senha: str = Field(..., min_length=8, max_length=100)


# A senha nunca volta na resposta da API.
class UsuarioSaida(BaseModel):
    id: int
    nome: str
    # Admin aparece na resposta, mas não pode ser escolhido ao criar uma conta pela API.
    tipo: Literal["visitante", "equipe", "admin"]
    email: str


class Token(BaseModel):
    access_token: str | None = None
    token_type: str | None = None
    etapa: Literal["email_pendente", "configurar_autenticador", "codigo_autenticador"] | None = None
    chave_autenticador: str | None = None
    desafio: str | None = None


class Login(BaseModel):
    email: str = Field(..., min_length=5, max_length=100)
    senha: str = Field(..., min_length=8, max_length=100)
    codigo: str | None = Field(default=None, max_length=6)
    desafio: str | None = Field(default=None, max_length=1000)
    reenviar_confirmacao: bool = False


class ConfirmacaoEmail(BaseModel):
    token: str = Field(min_length=1, max_length=1000)
