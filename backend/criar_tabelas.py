from banco import Base, engine
from modelos.usuario import Usuario
from modelos.aviso import Aviso
from modelos.ocorrencia import Ocorrencia

# Os imports registram os três modelos; create_all cria somente tabelas que ainda não existem.
# Este comando é executado manualmente, nunca na inicialização da API.
if __name__ == "__main__":
    Base.metadata.create_all(engine)
    print("Tabelas:", list(Base.metadata.tables))
