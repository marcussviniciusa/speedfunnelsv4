FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./

# Instalando as dependências padrão e adicionando dependências extras que podem estar faltando
RUN npm install && \
    npm install --save react-datepicker @mui/lab @date-io/date-fns date-fns react-chartjs-2 chart.js

COPY . .

# Configurando o NODE_ENV para produção
ENV NODE_ENV=production
# Desativando o modo CI para permitir warnings de linting durante o build
ENV CI=false

RUN npm run build

# Segunda etapa - usando serve para servir conteúdo estático
FROM node:18-alpine

WORKDIR /app

# Instala o servidor serve globalmente
RUN npm install -g serve

# Copia os arquivos do build da etapa anterior
COPY --from=build /app/build ./build

# Define variável de ambiente para configuração de API proxy
ENV REACT_APP_API_URL=http://api:3000

EXPOSE 80

# Inicia o serve com configuração para proxy de API
CMD ["serve", "-s", "build", "-l", "80"]
