const axios = require('axios');
const { DateTime } = require('luxon');
const logger = require('../utils/logger');
const { redisClient } = require('../utils/redis');

/**
 * Serviço para interação com a API do Meta Ads
 */
class MetaAdsService {
  constructor() {
    this.apiUrl = 'https://graph.facebook.com/v19.0';
  }

  /**
   * Obtém métricas de resumo para o período especificado
   * @param {string} startDate - Data de início (YYYY-MM-DD)
   * @param {string} endDate - Data de fim (YYYY-MM-DD)
   * @param {string} clientId - ID do cliente (opcional)
   * @param {Object} metaAccount - Objeto com as credenciais da conta Meta
   * @returns {Promise<Object>} Dados resumidos
   */
  async getSummary(startDate, endDate, clientId, metaAccount) {
    const { accessToken, adAccounts } = metaAccount;
    let adAccountId = null;
    
    // Seleciona a primeira conta de anúncios disponível
    if (adAccounts && adAccounts.length > 0) {
      adAccountId = adAccounts[0].id;
    } else {
      throw new Error('Nenhuma conta de anúncios disponível');
    }
    
    const cacheKey = `meta_ads_summary_${startDate}_${endDate}_${clientId || 'all'}_${adAccountId}`;
    
    // Verifica se há dados em cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info('Usando dados em cache para o resumo do Meta Ads');
      return JSON.parse(cachedData);
    }
    
    try {
      // Prepara parâmetros de consulta
      const params = this._getQueryParams(startDate, endDate, clientId, accessToken);
      
      // Adiciona métricas para o resumo
      params.fields = 'impressions,clicks,ctr,spend,cpc,conversions,cost_per_conversion,conversion_rate,roas';
      
      // Faz a chamada à API
      const response = await this._makeApiRequest(`${adAccountId}/insights`, params);
      
      // Calcula mudanças percentuais comparando com período anterior
      const previousPeriod = this._getPreviousPeriod(startDate, endDate);
      const previousResponse = await this._makeApiRequest(`${adAccountId}/insights`, {
        ...params,
        time_range: previousPeriod
      });
      
      // Processa os dados de resumo
      const currentData = response.data[0] || {};
      const previousData = previousResponse.data[0] || {};
      
      // Formata os resultados
      const result = {
        impressions: parseInt(currentData.impressions || 0),
        clicks: parseInt(currentData.clicks || 0),
        ctr: parseFloat(currentData.ctr || 0),
        spend: parseFloat(currentData.spend || 0),
        cpc: parseFloat(currentData.cpc || 0),
        conversions: parseInt(currentData.conversions || 0),
        costPerConversion: parseFloat(currentData.cost_per_conversion || 0),
        conversionRate: parseFloat(currentData.conversion_rate || 0),
        roas: parseFloat(currentData.roas || 0),
        
        // Calcula mudanças percentuais
        impressionsChange: this._calculatePercentChange(
          currentData.impressions, 
          previousData.impressions
        ),
        clicksChange: this._calculatePercentChange(
          currentData.clicks, 
          previousData.clicks
        ),
        ctrChange: this._calculatePercentChange(
          currentData.ctr, 
          previousData.ctr
        ),
        spendChange: this._calculatePercentChange(
          currentData.spend, 
          previousData.spend
        ),
        cpcChange: this._calculatePercentChange(
          currentData.cpc, 
          previousData.cpc
        ),
        conversionsChange: this._calculatePercentChange(
          currentData.conversions, 
          previousData.conversions
        ),
        costPerConversionChange: this._calculatePercentChange(
          currentData.cost_per_conversion, 
          previousData.cost_per_conversion
        ),
        conversionRateChange: this._calculatePercentChange(
          currentData.conversion_rate, 
          previousData.conversion_rate
        ),
        roasChange: this._calculatePercentChange(
          currentData.roas, 
          previousData.roas
        )
      };
      
      // Armazena em cache por 1 hora
      await redisClient.set(cacheKey, JSON.stringify(result), 'EX', 3600);
      
      return result;
    } catch (error) {
      logger.error(`Erro ao obter resumo do Meta Ads: ${error.message}`, { stack: error.stack });
      throw error;
    }
  }

  /**
   * Obtém dados de desempenho diário
   * @param {string} startDate - Data de início (YYYY-MM-DD)
   * @param {string} endDate - Data de fim (YYYY-MM-DD)
   * @param {string} clientId - ID do cliente (opcional)
   * @param {Object} metaAccount - Objeto com as credenciais da conta Meta
   * @returns {Promise<Array>} Dados de desempenho por dia
   */
  async getPerformance(startDate, endDate, clientId, metaAccount) {
    const { accessToken, adAccounts } = metaAccount;
    let adAccountId = null;
    
    // Seleciona a primeira conta de anúncios disponível
    if (adAccounts && adAccounts.length > 0) {
      adAccountId = adAccounts[0].id;
    } else {
      throw new Error('Nenhuma conta de anúncios disponível');
    }
    
    const cacheKey = `meta_ads_performance_${startDate}_${endDate}_${clientId || 'all'}_${adAccountId}`;
    
    // Verifica se há dados em cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info('Usando dados em cache para o desempenho do Meta Ads');
      return JSON.parse(cachedData);
    }
    
    try {
      // Prepara parâmetros de consulta
      const params = this._getQueryParams(startDate, endDate, clientId, accessToken);
      
      // Configura para dados diários
      params.time_increment = 1;
      params.fields = 'date_start,impressions,clicks,ctr,spend,cpc,conversions,cost_per_conversion';
      
      // Faz a chamada à API
      const response = await this._makeApiRequest(`${adAccountId}/insights`, params);
      
      // Formata os resultados
      const result = response.data.map(day => ({
        date: this._formatDate(day.date_start),
        impressions: parseInt(day.impressions || 0),
        clicks: parseInt(day.clicks || 0),
        ctr: parseFloat(day.ctr || 0),
        spend: parseFloat(day.spend || 0),
        cpc: parseFloat(day.cpc || 0),
        conversions: parseInt(day.conversions || 0),
        costPerConversion: parseFloat(day.cost_per_conversion || 0)
      }));
      
      // Armazena em cache por 1 hora
      await redisClient.set(cacheKey, JSON.stringify(result), 'EX', 3600);
      
      return result;
    } catch (error) {
      logger.error(`Erro ao obter desempenho do Meta Ads: ${error.message}`, { stack: error.stack });
      throw error;
    }
  }

  /**
   * Obtém lista de campanhas
   * @param {string} startDate - Data de início (YYYY-MM-DD)
   * @param {string} endDate - Data de fim (YYYY-MM-DD)
   * @param {string} clientId - ID do cliente (opcional)
   * @param {Object} metaAccount - Objeto com as credenciais da conta Meta
   * @returns {Promise<Array>} Lista de campanhas com métricas
   */
  async getCampaigns(startDate, endDate, clientId, metaAccount) {
    const { accessToken, adAccounts } = metaAccount;
    let adAccountId = null;
    
    // Seleciona a primeira conta de anúncios disponível
    if (adAccounts && adAccounts.length > 0) {
      adAccountId = adAccounts[0].id;
    } else {
      throw new Error('Nenhuma conta de anúncios disponível');
    }
    
    const cacheKey = `meta_ads_campaigns_${startDate}_${endDate}_${clientId || 'all'}_${adAccountId}`;
    
    // Verifica se há dados em cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info('Usando dados em cache para campanhas do Meta Ads');
      return JSON.parse(cachedData);
    }
    
    try {
      // Obtém a lista de campanhas
      const campaignsResponse = await this._makeApiRequest(`${adAccountId}/campaigns`, {
        fields: 'id,name,status,objective,daily_budget,lifetime_budget',
        limit: 100,
        access_token: accessToken
      });
      
      // Filtra campanhas por cliente se necessário
      let campaigns = campaignsResponse.data;
      if (clientId) {
        // Implementaria a lógica para filtrar por cliente aqui
        // Por exemplo, verificando metadados ou tags da campanha
      }
      
      // Obtém as métricas para cada campanha
      const insightsParams = this._getQueryParams(startDate, endDate, clientId, accessToken);
      insightsParams.fields = 'campaign_id,impressions,clicks,ctr,spend,cpc,conversions,cost_per_conversion,conversion_rate';
      insightsParams.level = 'campaign';
      
      const insightsResponse = await this._makeApiRequest(`${adAccountId}/insights`, insightsParams);
      
      // Mapeia as métricas para cada campanha
      const insightsMap = {};
      insightsResponse.data.forEach(insight => {
        insightsMap[insight.campaign_id] = insight;
      });
      
      // Combina os dados de campanhas com as métricas
      const result = campaigns.map(campaign => {
        const insight = insightsMap[campaign.id] || {};
        
        return {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          objective: campaign.objective,
          budget: parseFloat(campaign.daily_budget || campaign.lifetime_budget || 0),
          impressions: parseInt(insight.impressions || 0),
          clicks: parseInt(insight.clicks || 0),
          ctr: parseFloat(insight.ctr || 0),
          spend: parseFloat(insight.spend || 0),
          cpc: parseFloat(insight.cpc || 0),
          conversions: parseInt(insight.conversions || 0),
          costPerConversion: parseFloat(insight.cost_per_conversion || 0),
          conversionRate: parseFloat(insight.conversion_rate || 0)
        };
      });
      
      // Armazena em cache por 1 hora
      await redisClient.set(cacheKey, JSON.stringify(result), 'EX', 3600);
      
      return result;
    } catch (error) {
      logger.error(`Erro ao obter campanhas do Meta Ads: ${error.message}`, { stack: error.stack });
      throw error;
    }
  }

  /**
   * Obtém lista de conjuntos de anúncios
   * @param {string} startDate - Data de início (YYYY-MM-DD)
   * @param {string} endDate - Data de fim (YYYY-MM-DD)
   * @param {string} clientId - ID do cliente (opcional)
   * @param {Object} metaAccount - Objeto com as credenciais da conta Meta
   * @returns {Promise<Array>} Lista de conjuntos de anúncios com métricas
   */
  async getAdSets(startDate, endDate, clientId, metaAccount) {
    const { accessToken, adAccounts } = metaAccount;
    let adAccountId = null;
    
    // Seleciona a primeira conta de anúncios disponível
    if (adAccounts && adAccounts.length > 0) {
      adAccountId = adAccounts[0].id;
    } else {
      throw new Error('Nenhuma conta de anúncios disponível');
    }
    
    const cacheKey = `meta_ads_adsets_${startDate}_${endDate}_${clientId || 'all'}_${adAccountId}`;
    
    // Verifica se há dados em cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info('Usando dados em cache para conjuntos de anúncios do Meta Ads');
      return JSON.parse(cachedData);
    }
    
    try {
      // Prepara parâmetros para a consulta de conjuntos de anúncios
      const adSetsParams = {
        fields: 'id,name,status,campaign_id,targeting,daily_budget,lifetime_budget',
        limit: 100,
        access_token: accessToken
      };
      
      // Obtém a lista de conjuntos de anúncios
      const adSetsResponse = await this._makeApiRequest(`${adAccountId}/adsets`, adSetsParams);
      
      // Filtra conjuntos de anúncios por cliente se necessário
      let adSets = adSetsResponse.data;
      if (clientId) {
        // Implementaria a lógica para filtrar por cliente aqui
      }
      
      // Obtém as métricas para cada conjunto de anúncios
      const insightsParams = this._getQueryParams(startDate, endDate, clientId, accessToken);
      insightsParams.fields = 'adset_id,campaign_id,impressions,clicks,ctr,spend,cpc,conversions,cost_per_conversion,conversion_rate';
      insightsParams.level = 'adset';
      
      const insightsResponse = await this._makeApiRequest(`${adAccountId}/insights`, insightsParams);
      
      // Mapeia as métricas para cada conjunto de anúncios
      const insightsMap = {};
      insightsResponse.data.forEach(insight => {
        insightsMap[insight.adset_id] = insight;
      });
      
      // Obtém os nomes das campanhas
      const campaignIds = [...new Set(adSets.map(adSet => adSet.campaign_id))];
      const campaignsResponse = await this._makeApiRequest('', {
        ids: campaignIds.join(','),
        fields: 'id,name',
        access_token: accessToken
      });
      
      const campaignNames = {};
      for (const id in campaignsResponse.data) {
        campaignNames[id] = campaignsResponse.data[id].name;
      }
      
      // Combina os dados de conjuntos de anúncios com as métricas
      const result = adSets.map(adSet => {
        const insight = insightsMap[adSet.id] || {};
        
        return {
          id: adSet.id,
          name: adSet.name,
          status: adSet.status,
          campaignId: adSet.campaign_id,
          campaignName: campaignNames[adSet.campaign_id] || 'Desconhecido',
          budget: parseFloat(adSet.daily_budget || adSet.lifetime_budget || 0),
          impressions: parseInt(insight.impressions || 0),
          clicks: parseInt(insight.clicks || 0),
          ctr: parseFloat(insight.ctr || 0),
          spend: parseFloat(insight.spend || 0),
          cpc: parseFloat(insight.cpc || 0),
          conversions: parseInt(insight.conversions || 0),
          costPerConversion: parseFloat(insight.cost_per_conversion || 0),
          conversionRate: parseFloat(insight.conversion_rate || 0)
        };
      });
      
      // Armazena em cache por 1 hora
      await redisClient.set(cacheKey, JSON.stringify(result), 'EX', 3600);
      
      return result;
    } catch (error) {
      logger.error(`Erro ao obter conjuntos de anúncios do Meta Ads: ${error.message}`, { stack: error.stack });
      throw error;
    }
  }

  /**
   * Obtém lista de anúncios
   * @param {string} startDate - Data de início (YYYY-MM-DD)
   * @param {string} endDate - Data de fim (YYYY-MM-DD)
   * @param {string} clientId - ID do cliente (opcional)
   * @param {Object} metaAccount - Objeto com as credenciais da conta Meta
   * @returns {Promise<Array>} Lista de anúncios com métricas
   */
  async getAds(startDate, endDate, clientId, metaAccount) {
    const { accessToken, adAccounts } = metaAccount;
    let adAccountId = null;
    
    // Seleciona a primeira conta de anúncios disponível
    if (adAccounts && adAccounts.length > 0) {
      adAccountId = adAccounts[0].id;
    } else {
      throw new Error('Nenhuma conta de anúncios disponível');
    }
    
    const cacheKey = `meta_ads_ads_${startDate}_${endDate}_${clientId || 'all'}_${adAccountId}`;
    
    // Verifica se há dados em cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info('Usando dados em cache para anúncios do Meta Ads');
      return JSON.parse(cachedData);
    }
    
    try {
      // Prepara parâmetros para a consulta de anúncios
      const adsParams = {
        fields: 'id,name,status,adset_id,creative',
        limit: 100,
        access_token: accessToken
      };
      
      // Obtém a lista de anúncios
      const adsResponse = await this._makeApiRequest(`${adAccountId}/ads`, adsParams);
      
      // Filtra anúncios
      let ads = adsResponse.data;
      
      if (clientId) {
        // Se temos restrições de cliente, precisamos obter os conjuntos de anúncios primeiro
        const adSets = await this.getAdSets(startDate, endDate, clientId, metaAccount);
        const adSetIds = adSets.map(adSet => adSet.id);
        
        // Filtra anúncios pelos conjuntos de anúncios
        ads = ads.filter(ad => adSetIds.includes(ad.adset_id));
      }
      
      // Obtém as métricas para cada anúncio
      const insightsParams = this._getQueryParams(startDate, endDate, clientId, accessToken);
      insightsParams.fields = 'ad_id,adset_id,impressions,clicks,ctr,spend,cpc,conversions,cost_per_conversion,conversion_rate';
      insightsParams.level = 'ad';
      
      const insightsResponse = await this._makeApiRequest(`${adAccountId}/insights`, insightsParams);
      
      // Mapeia as métricas para cada anúncio
      const insightsMap = {};
      insightsResponse.data.forEach(insight => {
        insightsMap[insight.ad_id] = insight;
      });
      
      // Obtém informações dos conjuntos de anúncios
      const adSetIds = [...new Set(ads.map(ad => ad.adset_id))];
      const adSetsResponse = await this._makeApiRequest('', {
        ids: adSetIds.join(','),
        fields: 'id,name,campaign_id',
        access_token: accessToken
      });
      
      const adSetInfo = {};
      for (const id in adSetsResponse.data) {
        adSetInfo[id] = adSetsResponse.data[id];
      }
      
      // Obtém informações das campanhas para os conjuntos de anúncios
      const campaignIds = [...new Set(Object.values(adSetInfo).map(adSet => adSet.campaign_id))];
      const campaignsResponse = await this._makeApiRequest('', {
        ids: campaignIds.join(','),
        fields: 'id,name',
        access_token: accessToken
      });
      
      const campaignInfo = {};
      for (const id in campaignsResponse.data) {
        campaignInfo[id] = campaignsResponse.data[id];
      }
      
      // Combina os dados de anúncios com as métricas
      const result = ads.map(ad => {
        const insight = insightsMap[ad.id] || {};
        const adSetData = adSetInfo[ad.adset_id] || {};
        const campaignData = campaignInfo[adSetData.campaign_id] || {};
        
        return {
          id: ad.id,
          name: ad.name,
          status: ad.status,
          adSetId: ad.adset_id,
          adSetName: adSetData.name || 'Desconhecido',
          campaignId: adSetData.campaign_id,
          campaignName: campaignData.name || 'Desconhecido',
          impressions: parseInt(insight.impressions || 0),
          clicks: parseInt(insight.clicks || 0),
          ctr: parseFloat(insight.ctr || 0),
          spend: parseFloat(insight.spend || 0),
          cpc: parseFloat(insight.cpc || 0),
          conversions: parseInt(insight.conversions || 0),
          costPerConversion: parseFloat(insight.cost_per_conversion || 0),
          conversionRate: parseFloat(insight.conversion_rate || 0)
        };
      });
      
      // Armazena em cache por 1 hora
      await redisClient.set(cacheKey, JSON.stringify(result), 'EX', 3600);
      
      return result;
    } catch (error) {
      logger.error(`Erro ao obter anúncios do Meta Ads: ${error.message}`, { stack: error.stack });
      throw error;
    }
  }

  /**
   * Obtém parâmetros de consulta padrão para requisições à API
   * @param {string} startDate - Data de início (YYYY-MM-DD)
   * @param {string} endDate - Data de fim (YYYY-MM-DD)
   * @param {string} clientId - ID do cliente (opcional)
   * @param {string} accessToken - Token de acesso
   * @returns {Object} Parâmetros de consulta
   * @private
   */
  _getQueryParams(startDate, endDate, clientId, accessToken) {
    // Configura o intervalo de datas
    const timeRange = {
      since: startDate,
      until: endDate
    };
    
    const params = {
      access_token: accessToken,
      time_range: JSON.stringify(timeRange),
      date_preset: 'lifetime',
      level: 'account'
    };
    
    // Filtra por cliente se especificado
    if (clientId) {
      // Implemente o filtro por cliente conforme necessário
    }
    
    return params;
  }

  /**
   * Realiza uma requisição à API do Meta Ads
   * @param {string} endpoint - Endpoint da API
   * @param {Object} params - Parâmetros da requisição
   * @returns {Promise<Object>} Resposta da API
   * @private
   */
  async _makeApiRequest(endpoint, params) {
    try {
      const response = await axios.get(`${this.apiUrl}/${endpoint}`, { params });
      return response.data;
    } catch (error) {
      logger.error(`Erro na requisição à API do Meta Ads: ${error.message}`, {
        endpoint,
        errorResponse: error.response?.data
      });
      
      throw new Error(error.response?.data?.error?.message || error.message);
    }
  }
  
  /**
   * Calcula o período anterior para comparação
   * @param {string} startDate - Data de início (YYYY-MM-DD)
   * @param {string} endDate - Data de fim (YYYY-MM-DD)
   * @returns {Object} Período anterior
   * @private
   */
  _getPreviousPeriod(startDate, endDate) {
    const start = DateTime.fromISO(startDate);
    const end = DateTime.fromISO(endDate);
    const duration = end.diff(start).as('days');
    
    const previousEnd = start.minus({ days: 1 });
    const previousStart = previousEnd.minus({ days: duration });
    
    return {
      since: previousStart.toFormat('yyyy-MM-dd'),
      until: previousEnd.toFormat('yyyy-MM-dd')
    };
  }

  /**
   * Calcula a mudança percentual entre dois valores
   * @param {number|string} current - Valor atual
   * @param {number|string} previous - Valor anterior
   * @returns {number} Mudança percentual
   * @private
   */
  _calculatePercentChange(current, previous) {
    const currentVal = parseFloat(current) || 0;
    const previousVal = parseFloat(previous) || 0;
    
    if (previousVal === 0) {
      return currentVal > 0 ? 100 : 0;
    }
    
    return parseFloat(((currentVal - previousVal) / previousVal * 100).toFixed(2));
  }

  /**
   * Formata uma data para exibição
   * @param {string} dateString - Data no formato YYYY-MM-DD
   * @returns {string} Data formatada (DD/MM)
   * @private
   */
  _formatDate(dateString) {
    const date = DateTime.fromISO(dateString);
    return date.toFormat('dd/MM');
  }
}

module.exports = new MetaAdsService();
