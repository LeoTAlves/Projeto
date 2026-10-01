import os
from dotenv import load_dotenv

# Carrega as variáveis do ambiente em um único ponto, para o back deixar a origem do front fixa e segura.
load_dotenv()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
