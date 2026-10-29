# Usa Node 22 apenas na etapa que compila o frontend.
FROM node:22 AS build

# Define a pasta de trabalho da compilação.
WORKDIR /app

# Copia os manifestos para instalar as versões travadas pelo lockfile.
COPY package.json package-lock.json ./

# Instala exatamente as dependências registradas no package-lock.json.
RUN npm ci

# Copia o código e a configuração do frontend para a etapa de build.
COPY . .

# Gera os arquivos estáticos de produção na pasta dist.
RUN npm run build

# Usa Caddy para servir os arquivos estáticos já compilados.
FROM caddy:2

# Copia o build do React para a pasta publicada pelo Caddy.
COPY --from=build /app/dist/ /srv/
