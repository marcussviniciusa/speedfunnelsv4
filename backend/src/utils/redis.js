const { createClient } = require('redis');
const config = require('../config/config');
const logger = require('./logger');

// Cliente Redis
let redisClient;

/**
 * Inicializa a conexão com o Redis
 */
const initRedis = async () => {
  try {
    redisClient = createClient({
      url: config.redis.url
    });

    // Eventos de conexão
    redisClient.on('connect', () => {
      logger.info('Conectado ao Redis');
    });

    redisClient.on('error', (err) => {
      logger.error(`Erro na conexão com Redis: ${err.message}`, { stack: err.stack });
    });

    redisClient.on('reconnecting', () => {
      logger.info('Reconectando ao Redis');
    });

    await redisClient.connect();
    
    return redisClient;
  } catch (error) {
    logger.error(`Erro ao inicializar Redis: ${error.message}`, { stack: error.stack });
    
    // Criamos um cliente mock para não quebrar a aplicação quando o Redis não estiver disponível
    return createRedisMock();
  }
};

/**
 * Cria um mock do cliente Redis para quando não há conexão disponível
 * Isso permite que a aplicação continue funcionando mesmo sem cache
 */
const createRedisMock = () => {
  logger.warn('Usando Redis mock - Cache desativado');
  
  return {
    get: async () => null,
    set: async () => true,
    del: async () => true,
    connect: async () => {},
    quit: async () => {},
    on: () => {}
  };
};

/**
 * Fecha a conexão com o Redis
 */
const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Conexão com Redis fechada');
  }
};

module.exports = {
  initRedis,
  closeRedis,
  get redisClient() {
    if (!redisClient) {
      // Retorna um mock até que a conexão seja inicializada
      return createRedisMock();
    }
    return redisClient;
  }
};
