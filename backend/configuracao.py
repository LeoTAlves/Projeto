import os
from dotenv import load_dotenv
from pathlib import Path

# Carrega as variáveis do ambiente em um único ponto, para o back deixar a origem do front fixa e segura.
load_dotenv(Path(__file__).with_name(".env"))

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# A configuração concentra a leitura do ambiente, inclusive a conexão que contém a senha.
def obter_configuracao():
    return {
        "frontend_url": FRONTEND_URL,
        "url_do_banco": os.getenv("URL_DO_BANCO"),
    }
