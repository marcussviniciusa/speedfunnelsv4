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

# Segunda etapa - servidor de produção
FROM nginx:alpine

# Copia os arquivos do build para a pasta do nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copia a configuração do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
