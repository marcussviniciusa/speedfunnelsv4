/**
 * Middleware de autenticação para o SpeedFunnels v4
 * Implementa a verificação de autenticação baseada em JWT para proteger as rotas da API
 */

const jwt = require('jsonwebtoken');
const { BusinessAccount } = require('../models/business-account.model');
const logger = require('../utils/logger');

/**
 * Middleware que verifica se o usuário está autenticado
 * Extrai e valida o token JWT do cabeçalho de autorização
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Extrair o token do cabeçalho de autorização
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Autorização ausente ou inválida' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verificar e decodificar o token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key_for_development');
    } catch (error) {
      logger.error(`Erro ao verificar token: ${error.message}`);
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    // Verificar se o usuário/conta existe
    if (decoded.businessAccountId) {
      const businessAccount = await BusinessAccount.findByPk(decoded.businessAccountId);
      if (!businessAccount) {
        return res.status(401).json({ error: 'Conta não encontrada' });
      }
      
      // Anexar informações da conta ao objeto de requisição
      req.businessAccount = businessAccount;
      req.userId = decoded.userId;
    } else {
      return res.status(401).json({ error: 'Token não contém informações da conta' });
    }

    next();
  } catch (error) {
    logger.error(`Erro no middleware de autenticação: ${error.message}`);
    return res.status(500).json({ error: 'Erro interno de autenticação' });
  }
};

module.exports = {
  authMiddleware
};
