const winston = require('winston');
const path = require('path');
const config = require('../config/config');

// Define os níveis de log e cores para o console
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define as cores para cada nível
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

// Adiciona as cores ao winston
winston.addColors(colors);

// Define o formato de log baseado no ambiente
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? `\n${info.stack}` : ''}`
  )
);

// Define o formato para console com cores
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? `\n${info.stack}` : ''}`
  )
);

// Define o nível de log baseado no ambiente
const level = config.server.env === 'development' ? 'debug' : 'http';

// Define os transportes (para onde os logs serão enviados)
const transports = [
  // Console para todos os ambientes
  new winston.transports.Console({
    format: consoleFormat,
    level
  }),
  
  // Arquivo para logs de erro em todos os ambientes
  new winston.transports.File({
    filename: path.join('logs', 'error.log'),
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }),
  
  // Arquivo para todos os logs (combina todos os níveis)
  new winston.transports.File({
    filename: path.join('logs', 'combined.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5
  })
];

// Cria a instância do logger
const logger = winston.createLogger({
  level,
  levels,
  format,
  transports,
  exitOnError: false
});

// Adiciona middleware de log para HTTP requests (express)
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

module.exports = logger;
