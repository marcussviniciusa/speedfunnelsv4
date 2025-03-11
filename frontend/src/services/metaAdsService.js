import api from './api';

/**
 * Serviço para interação com a API do Meta Ads
 */
const metaAdsService = {
  /**
   * Obtém o resumo dos dados do Meta Ads
   * @param {string} startDate - Data de início (YYYY-MM-DD)
   * @param {string} endDate - Data de fim (YYYY-MM-DD)
   * @param {string} clientId - ID do cliente (opcional)
   * @returns {Promise<Object>} Dados resumidos
   */
  getSummary: async (startDate, endDate, clientId) => {
    try {
      const params = { startDate, endDate };
      if (clientId) params.clientId = clientId;
      
      const response = await api.get('/meta-ads/summary', { params });
      return response.data;
    } catch (error) {
      throw new Error(`Erro ao obter resumo do Meta Ads: ${error.message}`);
    }
  },
  
  /**
   * Obtém o desempenho diário do Meta Ads
   * @param {string} startDate - Data de início (YYYY-MM-DD)
   * @param {string} endDate - Data de fim (YYYY-MM-DD)
   * @param {string} clientId - ID do cliente (opcional)
   * @returns {Promise<Array>} Dados de desempenho diário
   */
  getPerformance: async (startDate, endDate, clientId) => {
    try {
      const params = { startDate, endDate };
      if (clientId) params.clientId = clientId;
      
      const response = await api.get('/meta-ads/performance', { params });
      return response.data;
    } catch (error) {
      throw new Error(`Erro ao obter desempenho do Meta Ads: ${error.message}`);
    }
  },
  
  /**
   * Obtém a lista de campanhas do Meta Ads
   * @param {string} startDate - Data de início (YYYY-MM-DD)
   * @param {string} endDate - Data de fim (YYYY-MM-DD)
   * @param {string} clientId - ID do cliente (opcional)
   * @returns {Promise<Array>} Lista de campanhas
   */
  getCampaigns: async (startDate, endDate, clientId) => {
    try {
      const params = { startDate, endDate };
      if (clientId) params.clientId = clientId;
      
      const response = await api.get('/meta-ads/campaigns', { params });
      return response.data;
    } catch (error) {
      throw new Error(`Erro ao obter campanhas do Meta Ads: ${error.message}`);
    }
  },
  
  /**
   * Obtém a lista de conjuntos de anúncios do Meta Ads
   * @param {string} startDate - Data de início (YYYY-MM-DD)
   * @param {string} endDate - Data de fim (YYYY-MM-DD)
   * @param {string} clientId - ID do cliente (opcional)
   * @param {string} campaignId - ID da campanha (opcional)
   * @returns {Promise<Array>} Lista de conjuntos de anúncios
   */
  getAdSets: async (startDate, endDate, clientId, campaignId) => {
    try {
      const params = { startDate, endDate };
      if (clientId) params.clientId = clientId;
      if (campaignId) params.campaignId = campaignId;
      
      const response = await api.get('/meta-ads/adsets', { params });
      return response.data;
    } catch (error) {
      throw new Error(`Erro ao obter conjuntos de anúncios do Meta Ads: ${error.message}`);
    }
  },
  
  /**
   * Obtém a lista de anúncios do Meta Ads
   * @param {string} startDate - Data de início (YYYY-MM-DD)
   * @param {string} endDate - Data de fim (YYYY-MM-DD)
   * @param {string} clientId - ID do cliente (opcional)
   * @param {string} campaignId - ID da campanha (opcional)
   * @param {string} adSetId - ID do conjunto de anúncios (opcional)
   * @returns {Promise<Array>} Lista de anúncios
   */
  getAds: async (startDate, endDate, clientId, campaignId, adSetId) => {
    try {
      const params = { startDate, endDate };
      if (clientId) params.clientId = clientId;
      if (campaignId) params.campaignId = campaignId;
      if (adSetId) params.adSetId = adSetId;
      
      const response = await api.get('/meta-ads/ads', { params });
      return response.data;
    } catch (error) {
      throw new Error(`Erro ao obter anúncios do Meta Ads: ${error.message}`);
    }
  }
};

export default metaAdsService;
