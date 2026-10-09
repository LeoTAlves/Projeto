from pwdlib import PasswordHash
hasher = PasswordHash.recommended()

def gerar_hash(senha: str):                    # no cadastro
    return hasher.hash(senha)
def verificar_senha(senha: str, senha_hash: str):  # no login: True ou False
    return hasher.verify(senha, senha_hash)

