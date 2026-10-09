from sqlalchemy import select

from modelos.usuario import Usuario


# A perda pertence a um visitante já cadastrado, conforme a cartilha.
def buscar_usuario_por_id(sessao, usuario_id):
    return sessao.get(Usuario, usuario_id)


def buscar_por_email(sessao, email):
    consulta = select(Usuario).where(Usuario.email == email)
    return sessao.scalar(consulta)


def listar(sessao):
    consulta = select(Usuario).order_by(Usuario.id)
    return sessao.scalars(consulta).all()


def salvar(sessao, dados):
    usuario = Usuario(**dados)
    sessao.add(usuario)
    sessao.commit()
    sessao.refresh(usuario)
    return usuario
