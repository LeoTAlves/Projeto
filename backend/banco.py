from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from configuracao import obter_configuracao

# O engine conhece a conexão; a senha permanece no ambiente local, fora do Git.
configuracao = obter_configuracao()
if not configuracao["url_do_banco"]:
    raise ValueError("Configure URL_DO_BANCO no backend/.env antes de iniciar a API.")
engine = create_engine(configuracao["url_do_banco"])
Sessao = sessionmaker(bind=engine)


# DeclarativeBase reúne os modelos que o criar_tabelas apresenta ao SQLAlchemy.
class Base(DeclarativeBase):
    pass


# O with fecha a sessão mesmo com erro; yield entrega a mesma sessão durante a requisição.
def obter_sessao():
    with Sessao() as sessao:
        yield sessao
