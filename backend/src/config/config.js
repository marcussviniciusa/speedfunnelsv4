/**
 * Configurações da aplicação
 */
require('dotenv').config();

module.exports = {
  // Configurações do servidor
  server: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || 'development'
  },
  
  // Configurações do banco de dados
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'speedfunnels',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    dialect: 'postgres'
  },
  
  // Configurações do Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    ttl: 3600 // Tempo de vida do cache em segundos (1 hora)
  },
  
  // Configurações de autenticação
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'speedfunnels_secret_key',
    jwtExpiration: process.env.JWT_EXPIRATION || '24h',
    saltRounds: 10
  },
  
  // Configurações do Meta Ads API
  meta: {
    accessToken: process.env.META_ACCESS_TOKEN,
    adAccountId: process.env.META_AD_ACCOUNT_ID
  },
  
  // Configurações do Google Analytics
  googleAnalytics: {
    viewId: process.env.GA_VIEW_ID,
    clientEmail: process.env.GA_CLIENT_EMAIL,
    privateKey: process.env.GA_PRIVATE_KEY ? process.env.GA_PRIVATE_KEY.replace(/\\n/g, '\n') : ''
  }
};
