# Usa Python 3.12 em uma imagem enxuta para executar a API no contêiner.
FROM python:3.12-slim

# Define a pasta de trabalho onde a aplicação será instalada.
WORKDIR /app

# Copia primeiro a lista de dependências para aproveitar o cache de camadas.
COPY requirements.txt ./

# Instala as dependências antes de copiar o código da aplicação.
RUN pip install --no-cache-dir -r requirements.txt

# Copia a API, os modelos e as migrations para a imagem.
COPY . .

# Inicia a API em modo de produção na porta interna 8000.
CMD ["fastapi", "run", "main.py", "--port", "8000"]
