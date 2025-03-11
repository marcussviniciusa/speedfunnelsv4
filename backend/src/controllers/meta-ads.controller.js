const logger = require('../utils/logger');
const metaAdsService = require('../services/meta-ads.service');

/**
 * Obtém o resumo dos dados do Meta Ads
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 */
exports.getSummary = async (req, res) => {
  try {
    const { startDate, endDate, clientId } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Datas de início e fim são obrigatórias' });
    }
    
    const data = await metaAdsService.getSummary(startDate, endDate, clientId, req.metaAccount);
    res.json(data);
  } catch (error) {
    logger.error(`Erro ao obter resumo do Meta Ads: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Erro ao obter dados do Meta Ads', error: error.message });
  }
};

/**
 * Obtém o desempenho diário do Meta Ads
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 */
exports.getPerformance = async (req, res) => {
  try {
    const { startDate, endDate, clientId } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Datas de início e fim são obrigatórias' });
    }
    
    const data = await metaAdsService.getPerformance(startDate, endDate, clientId, req.metaAccount);
    res.json(data);
  } catch (error) {
    logger.error(`Erro ao obter desempenho do Meta Ads: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Erro ao obter dados de desempenho', error: error.message });
  }
};

/**
 * Obtém a lista de campanhas do Meta Ads
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 */
exports.getCampaigns = async (req, res) => {
  try {
    const { startDate, endDate, clientId } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Datas de início e fim são obrigatórias' });
    }
    
    const data = await metaAdsService.getCampaigns(startDate, endDate, clientId, req.metaAccount);
    res.json(data);
  } catch (error) {
    logger.error(`Erro ao obter campanhas do Meta Ads: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Erro ao obter campanhas', error: error.message });
  }
};

/**
 * Obtém a lista de conjuntos de anúncios do Meta Ads
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 */
exports.getAdSets = async (req, res) => {
  try {
    const { startDate, endDate, clientId } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Datas de início e fim são obrigatórias' });
    }
    
    const data = await metaAdsService.getAdSets(startDate, endDate, clientId, req.metaAccount);
    res.json(data);
  } catch (error) {
    logger.error(`Erro ao obter conjuntos de anúncios do Meta Ads: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Erro ao obter conjuntos de anúncios', error: error.message });
  }
};

/**
 * Obtém a lista de anúncios do Meta Ads
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 */
exports.getAds = async (req, res) => {
  try {
    const { startDate, endDate, clientId } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Datas de início e fim são obrigatórias' });
    }
    
    const data = await metaAdsService.getAds(startDate, endDate, clientId, req.metaAccount);
    res.json(data);
  } catch (error) {
    logger.error(`Erro ao obter anúncios do Meta Ads: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Erro ao obter anúncios', error: error.message });
  }
};
