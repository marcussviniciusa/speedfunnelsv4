FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Use npm start for production environment
CMD ["npm", "start"]
