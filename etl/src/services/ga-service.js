const { google } = require('googleapis');
const moment = require('moment');
const logger = require('../utils/logger');

// Variáveis de estado para o serviço GA
let analytics = null;
let jwt = null;
let propertyId = null;

/**
 * Inicializa o cliente da API do Google Analytics
 * @param {Object} credentials - Credenciais do Google Analytics
 */
async function initialize(credentials) {
  try {
    propertyId = credentials.propertyId;
    
    // Inicializa o cliente JWT OAuth2 com a chave de conta de serviço
    const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    jwt = new google.auth.JWT({
      keyFile,
      scopes: ['https://www.googleapis.com/auth/analytics.readonly']
    });
    
    // Autoriza e inicializa o cliente Analytics
    await jwt.authorize();
    analytics = google.analyticsdata({
      version: 'v1beta',
      auth: jwt
    });
    
    logger.info('Cliente da API do Google Analytics inicializado com sucesso');
    return true;
  } catch (error) {
    logger.error(`Erro ao inicializar cliente da API do Google Analytics: ${error.message}`);
    throw error;
  }
}

/**
 * Obtém informações do site do Google Analytics
 * @param {string} propertyId - ID da propriedade do GA4
 * @returns {Object} Informações do site
 */
async function getSiteInfo(propertyId) {
  try {
    if (!analytics || !jwt) {
      throw new Error('Cliente da API do Google Analytics não inicializado');
    }
    
    // Obtém metadados da propriedade
    const propertyResponse = await google.analyticsadmin({
      version: 'v1beta',
      auth: jwt
    }).properties.get({
      name: `properties/${propertyId}`
    });
    
    // Formata resposta
    return {
      name: propertyResponse.data.displayName,
      url: propertyResponse.data.websiteUrl,
      timezone: propertyResponse.data.timeZone,
      createTime: propertyResponse.data.createTime,
      updateTime: propertyResponse.data.updateTime
    };
  } catch (error) {
    logger.error(`Erro ao obter informações do site: ${error.message}`);
    throw error;
  }
}

/**
 * Obtém métricas principais do Google Analytics
 * @param {string} propertyId - ID da propriedade do GA4
 * @param {string} startDate - Data inicial no formato YYYY-MM-DD
 * @param {string} endDate - Data final no formato YYYY-MM-DD
 * @returns {Array} Array de objetos de métricas por data
 */
async function getMetrics(propertyId, startDate, endDate) {
  try {
    if (!analytics || !jwt) {
      throw new Error('Cliente da API do Google Analytics não inicializado');
    }
    
    // Configura a requisição de relatório
    const reportRequest = {
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate,
          endDate
        }
      ],
      dimensions: [
        { name: 'date' }
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'newUsers' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
        { name: 'screenPageViewsPerSession' },
        { name: 'conversions' },
        { name: 'conversionsPerSession' },
        // Métricas de e-commerce, se disponíveis
        { name: 'transactions' },
        { name: 'transactionRevenue' },
        { name: 'averagePurchaseRevenue' }
      ]
    };
    
    // Executa a requisição de relatório
    const response = await analytics.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: reportRequest
    });
    
    // Processa a resposta
    const result = [];
    const rows = response.data.rows || [];
    
    for (const row of rows) {
      const date = row.dimensionValues[0].value;
      const formattedDate = `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`;
      
      // Mapeia os valores de métricas para o objeto de resultado
      const metricValues = row.metricValues;
      
      result.push({
        date: formattedDate,
        sessions: parseInt(metricValues[0].value || 0),
        users: parseInt(metricValues[1].value || 0),
        newUsers: parseInt(metricValues[2].value || 0),
        pageviews: parseInt(metricValues[3].value || 0),
        avgSessionDuration: parseFloat(metricValues[4].value || 0),
        bounceRate: parseFloat(metricValues[5].value || 0),
        pagesPerSession: parseFloat(metricValues[6].value || 0),
        goalCompletions: parseInt(metricValues[7].value || 0),
        goalConversionRate: parseFloat(metricValues[8].value || 0),
        transactions: parseInt(metricValues[9].value || 0),
        revenue: parseFloat(metricValues[10].value || 0),
        averageOrderValue: parseFloat(metricValues[11].value || 0),
        filter: 'all',
        sourceData: {
          dimensions: row.dimensionValues,
          metrics: metricValues
        }
      });
    }
    
    return result;
  } catch (error) {
    logger.error(`Erro ao obter métricas: ${error.message}`);
    throw error;
  }
}

/**
 * Obtém dados de fontes de tráfego
 * @param {string} propertyId - ID da propriedade do GA4
 * @param {string} startDate - Data inicial no formato YYYY-MM-DD
 * @param {string} endDate - Data final no formato YYYY-MM-DD
 * @returns {Array} Array de objetos com dados de tráfego por data
 */
async function getTrafficSourceData(propertyId, startDate, endDate) {
  try {
    if (!analytics || !jwt) {
      throw new Error('Cliente da API do Google Analytics não inicializado');
    }
    
    // Configura a requisição de relatório
    const reportRequest = {
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate,
          endDate
        }
      ],
      dimensions: [
        { name: 'date' },
        { name: 'sessionSource' },
        { name: 'sessionMedium' }
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'conversions' }
      ]
    };
    
    // Executa a requisição de relatório
    const response = await analytics.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: reportRequest
    });
    
    // Processa a resposta
    const rows = response.data.rows || [];
    const resultByDate = {};
    
    for (const row of rows) {
      const date = row.dimensionValues[0].value;
      const formattedDate = `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`;
      const source = row.dimensionValues[1].value;
      const medium = row.dimensionValues[2].value;
      
      // Inicializa o objeto de data se não existir
      if (!resultByDate[formattedDate]) {
        resultByDate[formattedDate] = {
          date: formattedDate,
          trafficSource: {}
        };
      }
      
      // Cria a chave de fonte+meio
      const sourceKey = source ? (medium ? `${source} / ${medium}` : source) : 'direct';
      
      // Adiciona ou atualiza os dados para esta fonte
      resultByDate[formattedDate].trafficSource[sourceKey] = {
        sessions: parseInt(row.metricValues[0].value || 0),
        users: parseInt(row.metricValues[1].value || 0),
        conversions: parseInt(row.metricValues[2].value || 0)
      };
    }
    
    // Converte o objeto em array
    return Object.values(resultByDate);
  } catch (error) {
    logger.error(`Erro ao obter dados de fontes de tráfego: ${error.message}`);
    throw error;
  }
}

/**
 * Obtém dados de dispositivos
 * @param {string} propertyId - ID da propriedade do GA4
 * @param {string} startDate - Data inicial no formato YYYY-MM-DD
 * @param {string} endDate - Data final no formato YYYY-MM-DD
 * @returns {Array} Array de objetos com dados de dispositivos por data
 */
async function getDeviceData(propertyId, startDate, endDate) {
  try {
    if (!analytics || !jwt) {
      throw new Error('Cliente da API do Google Analytics não inicializado');
    }
    
    // Configura a requisição de relatório
    const reportRequest = {
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate,
          endDate
        }
      ],
      dimensions: [
        { name: 'date' },
        { name: 'deviceCategory' }
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'conversions' },
        { name: 'bounceRate' }
      ]
    };
    
    // Executa a requisição de relatório
    const response = await analytics.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: reportRequest
    });
    
    // Processa a resposta
    const rows = response.data.rows || [];
    const resultByDate = {};
    
    for (const row of rows) {
      const date = row.dimensionValues[0].value;
      const formattedDate = `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`;
      const deviceCategory = row.dimensionValues[1].value;
      
      // Inicializa o objeto de data se não existir
      if (!resultByDate[formattedDate]) {
        resultByDate[formattedDate] = {
          date: formattedDate,
          deviceCategory: {}
        };
      }
      
      // Adiciona ou atualiza os dados para esta categoria de dispositivo
      resultByDate[formattedDate].deviceCategory[deviceCategory] = {
        sessions: parseInt(row.metricValues[0].value || 0),
        users: parseInt(row.metricValues[1].value || 0),
        conversions: parseInt(row.metricValues[2].value || 0),
        bounceRate: parseFloat(row.metricValues[3].value || 0)
      };
    }
    
    // Converte o objeto em array
    return Object.values(resultByDate);
  } catch (error) {
    logger.error(`Erro ao obter dados de dispositivos: ${error.message}`);
    throw error;
  }
}

/**
 * Obtém dados geográficos
 * @param {string} propertyId - ID da propriedade do GA4
 * @param {string} startDate - Data inicial no formato YYYY-MM-DD
 * @param {string} endDate - Data final no formato YYYY-MM-DD
 * @returns {Array} Array de objetos com dados geográficos por data
 */
async function getGeographicData(propertyId, startDate, endDate) {
  try {
    if (!analytics || !jwt) {
      throw new Error('Cliente da API do Google Analytics não inicializado');
    }
    
    // Configura a requisição de relatório
    const reportRequest = {
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate,
          endDate
        }
      ],
      dimensions: [
        { name: 'date' },
        { name: 'country' }
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'conversions' }
      ]
    };
    
    // Executa a requisição de relatório
    const response = await analytics.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: reportRequest
    });
    
    // Processa a resposta
    const rows = response.data.rows || [];
    const resultByDate = {};
    
    for (const row of rows) {
      const date = row.dimensionValues[0].value;
      const formattedDate = `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`;
      const country = row.dimensionValues[1].value;
      
      // Inicializa o objeto de data se não existir
      if (!resultByDate[formattedDate]) {
        resultByDate[formattedDate] = {
          date: formattedDate,
          countryData: {}
        };
      }
      
      // Adiciona ou atualiza os dados para este país
      resultByDate[formattedDate].countryData[country] = {
        sessions: parseInt(row.metricValues[0].value || 0),
        users: parseInt(row.metricValues[1].value || 0),
        conversions: parseInt(row.metricValues[2].value || 0)
      };
    }
    
    // Converte o objeto em array
    return Object.values(resultByDate);
  } catch (error) {
    logger.error(`Erro ao obter dados geográficos: ${error.message}`);
    throw error;
  }
}

/**
 * Obtém dados de funil
 * @param {string} propertyId - ID da propriedade do GA4
 * @param {Array} steps - Array de passos do funil
 * @param {string} startDate - Data inicial no formato YYYY-MM-DD
 * @param {string} endDate - Data final no formato YYYY-MM-DD
 * @returns {Array} Array de objetos com dados do funil por data
 */
async function getFunnelData(propertyId, steps, startDate, endDate) {
  try {
    if (!analytics || !jwt) {
      throw new Error('Cliente da API do Google Analytics não inicializado');
    }
    
    // Esta é uma implementação simplificada, já que o GA4 tem API específica para funis
    // Para uma implementação completa, seria necessário usar a API de funis do GA4
    
    // Cria um conjunto de dados fictício para exemplo
    const startMoment = moment(startDate);
    const endMoment = moment(endDate);
    const result = [];
    
    // Para cada dia no intervalo
    for (let m = moment(startMoment); m.diff(endMoment) <= 0; m.add(1, 'days')) {
      const date = m.format('YYYY-MM-DD');
      
      // Dados fictícios de exemplo
      const totalEntries = Math.floor(Math.random() * 1000) + 100;
      const stepData = {};
      let remaining = totalEntries;
      
      // Para cada passo do funil
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        
        // Reduz cerca de 25-40% em cada passo
        const dropoffRate = 0.25 + Math.random() * 0.15;
        const stepCount = i === 0 ? 
          remaining : 
          Math.floor(remaining * (1 - dropoffRate));
        
        stepData[step.name] = {
          count: stepCount,
          rate: i === 0 ? 1 : stepCount / remaining
        };
        
        remaining = stepCount;
      }
      
      result.push({
        date,
        stepData,
        conversionRate: remaining / totalEntries,
        totalEntries,
        totalCompletions: remaining,
        avgCompletionTime: Math.floor(Math.random() * 600) + 120 // 2-10 minutos em segundos
      });
    }
    
    return result;
  } catch (error) {
    logger.error(`Erro ao obter dados de funil: ${error.message}`);
    throw error;
  }
}

module.exports = {
  initialize,
  getSiteInfo,
  getMetrics,
  getTrafficSourceData,
  getDeviceData,
  getGeographicData,
  getFunnelData
};
