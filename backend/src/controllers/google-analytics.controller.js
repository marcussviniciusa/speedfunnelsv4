const logger = require('../utils/logger');
const gaService = require('../services/ga.service');

/**
 * Obtém o resumo dos dados do Google Analytics
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 */
exports.getSummary = async (req, res) => {
  try {
    const { startDate, endDate, clientId } = req.query;
    const userId = req.user.id;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Datas de início e fim são obrigatórias' });
    }
    
    const data = await gaService.getSummary(startDate, endDate, clientId, userId);
    res.json(data);
  } catch (error) {
    logger.error(`Erro ao obter resumo do Google Analytics: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Erro ao obter dados do Google Analytics', error: error.message });
  }
};

/**
 * Obtém o desempenho diário do Google Analytics
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 */
exports.getPerformance = async (req, res) => {
  try {
    const { startDate, endDate, clientId } = req.query;
    const userId = req.user.id;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Datas de início e fim são obrigatórias' });
    }
    
    const data = await gaService.getPerformance(startDate, endDate, clientId, userId);
    res.json(data);
  } catch (error) {
    logger.error(`Erro ao obter desempenho do Google Analytics: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Erro ao obter dados de desempenho', error: error.message });
  }
};

/**
 * Obtém os dados de tráfego por fonte/meio
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 */
exports.getTrafficSources = async (req, res) => {
  try {
    const { startDate, endDate, clientId } = req.query;
    const userId = req.user.id;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Datas de início e fim são obrigatórias' });
    }
    
    const data = await gaService.getTrafficSources(startDate, endDate, clientId, userId);
    res.json(data);
  } catch (error) {
    logger.error(`Erro ao obter fontes de tráfego do Google Analytics: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Erro ao obter dados de fontes de tráfego', error: error.message });
  }
};

/**
 * Obtém as páginas mais visitadas
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 */
exports.getTopPages = async (req, res) => {
  try {
    const { startDate, endDate, clientId, limit } = req.query;
    const userId = req.user.id;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Datas de início e fim são obrigatórias' });
    }
    
    const data = await gaService.getTopPages(startDate, endDate, clientId, limit, userId);
    res.json(data);
  } catch (error) {
    logger.error(`Erro ao obter páginas mais visitadas do Google Analytics: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Erro ao obter dados de páginas mais visitadas', error: error.message });
  }
};

/**
 * Obtém dados demográficos dos usuários
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 */
exports.getDemographics = async (req, res) => {
  try {
    const { startDate, endDate, clientId } = req.query;
    const userId = req.user.id;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Datas de início e fim são obrigatórias' });
    }
    
    const data = await gaService.getDemographics(startDate, endDate, clientId, userId);
    res.json(data);
  } catch (error) {
    logger.error(`Erro ao obter dados demográficos do Google Analytics: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Erro ao obter dados demográficos', error: error.message });
  }
};

/**
 * Obtém dados de eventos
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 */
exports.getEvents = async (req, res) => {
  try {
    const { startDate, endDate, clientId, eventCategory } = req.query;
    const userId = req.user.id;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Datas de início e fim são obrigatórias' });
    }
    
    const data = await gaService.getEvents(startDate, endDate, clientId, eventCategory, userId);
    res.json(data);
  } catch (error) {
    logger.error(`Erro ao obter dados de eventos do Google Analytics: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Erro ao obter dados de eventos', error: error.message });
  }
};
