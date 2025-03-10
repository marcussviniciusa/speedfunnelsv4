const jwt = require('jsonwebtoken');
const authService = require('../services/auth.service');
const logger = require('../utils/logger');

// Authentication middleware to verify JWT token
/**
 * Middleware de autenticação para verificar token JWT
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 * @param {Function} next - Função next do Express
 */
const authenticate = async (req, res, next) => {
  try {
    // Obtém token do cabeçalho Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Acesso não autorizado' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verifica o token
    const decoded = await authService.verifyToken(token);
    
    // Adiciona informações do usuário à requisição
    req.user = decoded;
    next();
  } catch (error) {
    logger.error(`Erro de autenticação: ${error.message}`);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado' });
    }
    return res.status(401).json({ message: 'Token inválido' });
  }
};

// Role-based authorization middleware
/**
 * Middleware de autorização baseada em papéis
 * @param {string|Array} roles - Papéis permitidos
 * @returns {Function} Middleware de autorização
 */
const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Acesso não autorizado' });
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Acesso proibido' });
    }
    
    next();
  };
};

module.exports = { authenticate, authorize };
