from sqlalchemy import func, select

from modelos.usuario import Usuario


# A perda pertence a um visitante já cadastrado, conforme a cartilha.
def buscar_usuario_por_id(sessao, usuario_id):
    return sessao.get(Usuario, usuario_id)


def buscar_por_email(sessao, email):
    email_normalizado = (email or "").strip().lower()
    consulta = select(Usuario).where(func.lower(Usuario.email) == email_normalizado)
    return sessao.scalar(consulta)


def listar(sessao):
    consulta = select(Usuario).order_by(Usuario.id)
    return sessao.scalars(consulta).all()


def salvar(sessao, dados, antes_de_confirmar=None):
    usuario = Usuario(**dados)
    sessao.add(usuario)
    if antes_de_confirmar:
        sessao.flush()
        antes_de_confirmar(usuario)
    sessao.commit()
    sessao.refresh(usuario)
    return usuario
