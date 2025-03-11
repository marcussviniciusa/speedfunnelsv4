/**
 * Middleware para validação de requisições para APIs de analytics
 */
const logger = require('../utils/logger');

/**
 * Valida parâmetros de data para requisições de analytics
 */
exports.validateDateParams = (req, res, next) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).json({ 
      message: 'Os parâmetros startDate e endDate são obrigatórios' 
    });
  }
  
  // Valida formato das datas (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  
  if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
    return res.status(400).json({ 
      message: 'As datas devem estar no formato YYYY-MM-DD' 
    });
  }
  
  // Valida se a data de início é anterior à data de fim
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start > end) {
    return res.status(400).json({ 
      message: 'A data de início deve ser anterior à data de fim' 
    });
  }
  
  // Limita o intervalo de datas para evitar consultas muito pesadas (máximo 1 ano)
  const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
  if (end - start > oneYearInMs) {
    return res.status(400).json({ 
      message: 'O intervalo máximo entre datas é de 1 ano' 
    });
  }
  
  next();
};

/**
 * Verifica se as credenciais do Google Analytics estão configuradas
 */
exports.checkGoogleAnalyticsCredentials = (req, res, next) => {
  const config = require('../config/config');
  
  if (!config.googleAnalytics.viewId || 
      !config.googleAnalytics.clientEmail || 
      !config.googleAnalytics.privateKey) {
    logger.error('Credenciais do Google Analytics não configuradas');
    return res.status(503).json({ 
      message: 'Serviço do Google Analytics não configurado corretamente' 
    });
  }
  
  next();
};

/**
 * Verifica se as credenciais do Meta Ads estão configuradas
 */
exports.checkMetaAdsCredentials = (req, res, next) => {
  const config = require('../config/config');
  
  if (!config.meta.accessToken || !config.meta.adAccountId) {
    logger.error('Credenciais do Meta Ads não configuradas');
    return res.status(503).json({ 
      message: 'Serviço do Meta Ads não configurado corretamente' 
    });
  }
  
  next();
};
