import api from './api';

/**
 * Serviço para interação com a API do Google Analytics
 */
const googleAnalyticsService = {
  /**
   * Obtém o resumo dos dados do Google Analytics
   * @param {string} startDate - Data de início (YYYY-MM-DD)
   * @param {string} endDate - Data de fim (YYYY-MM-DD)
   * @param {string} clientId - ID do cliente (opcional)
   * @returns {Promise<Object>} Dados resumidos
   */
  getSummary: async (startDate, endDate, clientId) => {
    try {
      const params = { startDate, endDate };
      if (clientId) params.clientId = clientId;
      
      const response = await api.get('/google-analytics/summary', { params });
      return response.data;
    } catch (error) {
      throw new Error(`Erro ao obter resumo do Google Analytics: ${error.message}`);
    }
  },
  
  /**
   * Obtém o desempenho diário do Google Analytics
   * @param {string} startDate - Data de início (YYYY-MM-DD)
   * @param {string} endDate - Data de fim (YYYY-MM-DD)
   * @param {string} clientId - ID do cliente (opcional)
   * @returns {Promise<Array>} Dados de desempenho diário
   */
  getPerformance: async (startDate, endDate, clientId) => {
    try {
      const params = { startDate, endDate };
      if (clientId) params.clientId = clientId;
      
      const response = await api.get('/google-analytics/performance', { params });
      return response.data;
    } catch (error) {
      throw new Error(`Erro ao obter desempenho do Google Analytics: ${error.message}`);
    }
  },
  
  /**
   * Obtém as fontes de tráfego do Google Analytics
   * @param {string} startDate - Data de início (YYYY-MM-DD)
   * @param {string} endDate - Data de fim (YYYY-MM-DD)
   * @param {string} clientId - ID do cliente (opcional)
   * @returns {Promise<Array>} Dados de fontes de tráfego
   */
  getTrafficSources: async (startDate, endDate, clientId) => {
    try {
      const params = { startDate, endDate };
      if (clientId) params.clientId = clientId;
      
      const response = await api.get('/google-analytics/traffic-sources', { params });
      return response.data;
    } catch (error) {
      throw new Error(`Erro ao obter fontes de tráfego do Google Analytics: ${error.message}`);
    }
  },
  
  /**
   * Obtém as páginas mais visitadas do Google Analytics
   * @param {string} startDate - Data de início (YYYY-MM-DD)
   * @param {string} endDate - Data de fim (YYYY-MM-DD)
   * @param {string} clientId - ID do cliente (opcional)
   * @param {number} limit - Limite de resultados (opcional)
   * @returns {Promise<Array>} Dados de páginas mais visitadas
   */
  getTopPages: async (startDate, endDate, clientId, limit = 10) => {
    try {
      const params = { startDate, endDate, limit };
      if (clientId) params.clientId = clientId;
      
      const response = await api.get('/google-analytics/top-pages', { params });
      return response.data;
    } catch (error) {
      throw new Error(`Erro ao obter páginas mais visitadas do Google Analytics: ${error.message}`);
    }
  },
  
  /**
   * Obtém os dados demográficos do Google Analytics
   * @param {string} startDate - Data de início (YYYY-MM-DD)
   * @param {string} endDate - Data de fim (YYYY-MM-DD)
   * @param {string} clientId - ID do cliente (opcional)
   * @returns {Promise<Object>} Dados demográficos
   */
  getDemographics: async (startDate, endDate, clientId) => {
    try {
      const params = { startDate, endDate };
      if (clientId) params.clientId = clientId;
      
      const response = await api.get('/google-analytics/demographics', { params });
      return response.data;
    } catch (error) {
      throw new Error(`Erro ao obter dados demográficos do Google Analytics: ${error.message}`);
    }
  },
  
  /**
   * Verifica se o usuário está conectado ao Google Analytics
   * @returns {Promise<boolean>} Status da conexão
   */
  checkConnection: async () => {
    try {
      const response = await api.get('/auth/google/connection-status');
      return response.data.connected;
    } catch (error) {
      console.error(`Erro ao verificar conexão com Google Analytics: ${error.message}`);
      return false;
    }
  }
};

export default googleAnalyticsService;
