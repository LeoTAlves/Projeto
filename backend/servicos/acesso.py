import os
import smtplib
import ssl
import time
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from urllib.parse import urlencode

import jwt
from fastapi import HTTPException
from sqlalchemy import func, select

from configuracao import obter_configuracao
from modelos.usuario import Usuario
from seguranca import criar_token, verificar_senha


def token_temporario(usuario, finalidade, minutos, **campos):
    dados = {
        "sub": str(usuario.id), "finalidade": finalidade,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=minutos),
        **campos,
    }
    return jwt.encode(dados, obter_configuracao()["chave_do_token"], algorithm="HS256")


def ler_token_temporario(token, finalidade):
    try:
        dados = jwt.decode(token, obter_configuracao()["chave_do_token"], algorithms=["HS256"],
                           options={"require": ["exp", "sub", "finalidade"]})
        if dados["finalidade"] == finalidade:
            return dados
    except jwt.InvalidTokenError:
        pass
    return {}


def enviar_confirmacao(usuario):
    host = os.getenv("SMTP_HOST")
    remetente = os.getenv("SMTP_FROM")
    pagina = os.getenv("URL_PUBLICA_CADE")
    if not all((host, remetente, pagina)):
        raise HTTPException(503, "O envio de confirmação de e-mail está indisponível.")
    token = token_temporario(usuario, "confirmar-email", 60, email=usuario.email)
    link = pagina.rstrip("/") + "/?" + urlencode({"confirmar_email": token})
    mensagem = EmailMessage()
    mensagem["From"] = remetente
    mensagem["To"] = usuario.email
    mensagem["Subject"] = "Confirme seu e-mail no Cadê!?"
    mensagem.set_content("Abra este link em até uma hora para confirmar seu e-mail:\n\n" + link)
    try:
        with smtplib.SMTP(host, int(os.getenv("SMTP_PORT", "587")), timeout=10) as cliente:
            cliente.starttls(context=ssl.create_default_context())
            if os.getenv("SMTP_USER"):
                cliente.login(os.environ["SMTP_USER"], os.getenv("SMTP_PASSWORD", ""))
            cliente.send_message(mensagem)
    except (OSError, smtplib.SMTPException, ValueError) as erro:
        raise HTTPException(503, "Não foi possível enviar a confirmação de e-mail.") from erro
    usuario.confirmacao_enviada_em = int(time.time())


def confirmar_email(sessao, token):
    dados = ler_token_temporario(token, "confirmar-email")
    usuario = sessao.get(Usuario, int(dados["sub"])) if dados else None
    if usuario is None or usuario.email != dados.get("email"):
        raise HTTPException(400, "Link de confirmação inválido ou expirado.")
    usuario.email_confirmado = True
    sessao.commit()


# A senha abre a sessão após a confirmação do e-mail, com limite de tentativas.
def login_seguro(sessao, dados):
    agora = int(time.time())
    email = dados.email.strip().lower()
    consulta = select(Usuario).where(func.lower(Usuario.email) == email).with_for_update()
    usuario = sessao.scalar(consulta)

    def falhar():
        if usuario is not None and (usuario.login_bloqueado_ate or 0) <= agora:
            if usuario.login_bloqueado_ate:
                usuario.falhas_login = 0
                usuario.login_bloqueado_ate = None
            usuario.falhas_login += 1
            if usuario.falhas_login >= 5:
                usuario.login_bloqueado_ate = agora + 300
            sessao.commit()
        raise HTTPException(401, "E-mail ou senha incorretos. Se tentou várias vezes, aguarde alguns minutos.")

    if usuario is None or (usuario.login_bloqueado_ate or 0) > agora or not verificar_senha(dados.senha, usuario.senha):
        falhar()
    if not usuario.email_confirmado:
        if dados.reenviar_confirmacao and (usuario.confirmacao_enviada_em or 0) <= agora - 60:
            enviar_confirmacao(usuario)
            sessao.commit()
        return {"etapa": "email_pendente"}

    usuario.falhas_login = 0
    usuario.login_bloqueado_ate = None
    sessao.commit()
    return {"access_token": criar_token(usuario.id), "token_type": "bearer"}
