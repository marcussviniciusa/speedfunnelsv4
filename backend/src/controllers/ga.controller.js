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
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Datas de início e fim são obrigatórias' });
    }
    
    const data = await gaService.getSummary(startDate, endDate, clientId);
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
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Datas de início e fim são obrigatórias' });
    }
    
    const data = await gaService.getPerformance(startDate, endDate, clientId);
    res.json(data);
  } catch (error) {
    logger.error(`Erro ao obter desempenho do Google Analytics: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Erro ao obter dados de desempenho', error: error.message });
  }
};

/**
 * Obtém dados de dispositivos do Google Analytics
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 */
exports.getDevices = async (req, res) => {
  try {
    const { startDate, endDate, clientId } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Datas de início e fim são obrigatórias' });
    }
    
    const data = await gaService.getDevices(startDate, endDate, clientId);
    res.json(data);
  } catch (error) {
    logger.error(`Erro ao obter dados de dispositivos do Google Analytics: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Erro ao obter dados de dispositivos', error: error.message });
  }
};

/**
 * Obtém dados de fontes de tráfego do Google Analytics
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 */
exports.getTrafficSources = async (req, res) => {
  try {
    const { startDate, endDate, clientId } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Datas de início e fim são obrigatórias' });
    }
    
    const data = await gaService.getTrafficSources(startDate, endDate, clientId);
    res.json(data);
  } catch (error) {
    logger.error(`Erro ao obter fontes de tráfego do Google Analytics: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Erro ao obter dados de fontes de tráfego', error: error.message });
  }
};

/**
 * Obtém dados geográficos do Google Analytics
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 */
exports.getGeography = async (req, res) => {
  try {
    const { startDate, endDate, clientId } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Datas de início e fim são obrigatórias' });
    }
    
    const data = await gaService.getGeography(startDate, endDate, clientId);
    res.json(data);
  } catch (error) {
    logger.error(`Erro ao obter dados geográficos do Google Analytics: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Erro ao obter dados geográficos', error: error.message });
  }
};
