import os
from dotenv import load_dotenv
from pathlib import Path

# Carrega as variáveis do ambiente em um único ponto, para o back deixar a origem do front fixa e segura.
load_dotenv(Path(__file__).with_name(".env"))

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
FRONTEND_URLS = [
    origem.strip().rstrip("/")
    for origem in FRONTEND_URL.split(",")
    if origem.strip()
]

chave_do_gemini = os.getenv("GEMINI_API_KEY")
chave_do_openrouter = os.getenv("OPENROUTER_API_KEY")
chave_do_claude = os.getenv("ANTHROPIC_API_KEY")

# A configuração concentra a leitura do ambiente, inclusive a conexão que contém a senha.
def obter_configuracao():
    return {
        "frontend_url": FRONTEND_URL,
        "url_do_banco": os.getenv("URL_DO_BANCO"),
        "chave_do_token": os.getenv("CHAVE_DO_TOKEN"),
        "chave_gemini": chave_do_gemini,
        "chave_openrouter": chave_do_openrouter,
        "chave_claude": chave_do_claude,
    }
