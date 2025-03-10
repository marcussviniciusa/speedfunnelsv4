const { google } = require('googleapis');
const { DateTime } = require('luxon');
const config = require('../config/config');
const logger = require('../utils/logger');
const { redisClient } = require('../utils/redis');

/**
 * Serviço para interação com a API do Google Analytics
 */
class GoogleAnalyticsService {
  constructor() {
    this.viewId = config.googleAnalytics.viewId;
    this.auth = null;
  }

  /**
   * Inicializa a autenticação com o Google Analytics
   * @private
   */
  async _initializeAuth() {
    if (this.auth) return;

    try {
      // Cria um cliente JWT usando a chave de conta de serviço
      this.auth = new google.auth.JWT({
        email: config.googleAnalytics.clientEmail,
        key: config.googleAnalytics.privateKey,
        scopes: ['https://www.googleapis.com/auth/analytics.readonly']
      });

      // Autentica com as APIs do Google
      await this.auth.authorize();
      
      // Inicializa o cliente do Analytics
      this.analyticsReporting = google.analyticsreporting({
        version: 'v4',
        auth: this.auth
      });
      
      this.analytics = google.analytics({
        version: 'v3',
        auth: this.auth
      });

      logger.info('Autenticação com Google Analytics inicializada com sucesso');
    } catch (error) {
      logger.error(`Erro ao inicializar autenticação com Google Analytics: ${error.message}`, { stack: error.stack });
      throw error;
    }
  }

  /**
   * Obtém métricas de resumo para o período especificado
   * @param {string} startDate - Data de início (YYYY-MM-DD)
   * @param {string} endDate - Data de fim (YYYY-MM-DD)
   * @param {string} clientId - ID do cliente (opcional)
   * @returns {Promise<Object>} Dados resumidos
   */
  async getSummary(startDate, endDate, clientId) {
    const cacheKey = `ga_summary_${startDate}_${endDate}_${clientId || 'all'}`;
    
    // Verifica se há dados em cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info('Usando dados em cache para o resumo do Google Analytics');
      return JSON.parse(cachedData);
    }
    
    try {
      await this._initializeAuth();
      
      // Calcula o período anterior para comparação
      const previousPeriod = this._getPreviousPeriod(startDate, endDate);
      
      // Configura a requisição para obter métricas principais
      const summaryRequest = {
        reportRequests: [
          {
            viewId: this.viewId,
            dateRanges: [
              {
                startDate,
                endDate
              }
            ],
            metrics: [
              { expression: 'ga:sessions' },
              { expression: 'ga:users' },
              { expression: 'ga:newUsers' },
              { expression: 'ga:sessionsPerUser' },
              { expression: 'ga:pageviews' },
              { expression: 'ga:pageviewsPerSession' },
              { expression: 'ga:avgSessionDuration' },
              { expression: 'ga:bounceRate' },
              { expression: 'ga:goalCompletionsAll' },
              { expression: 'ga:goalConversionRateAll' }
            ]
          }
        ]
      };
      
      // Adiciona filtro por cliente se necessário
      if (clientId) {
        summaryRequest.reportRequests[0].dimensionFilterClauses = [
          {
            filters: [
              {
                dimensionName: 'ga:dimension1', // Assumindo que o ID do cliente está na dimensão personalizada 1
                operator: 'EXACT',
                expressions: [clientId]
              }
            ]
          }
        ];
      }
      
      // Faz a mesma requisição para o período anterior
      const previousSummaryRequest = {
        ...summaryRequest,
        reportRequests: [
          {
            ...summaryRequest.reportRequests[0],
            dateRanges: [
              {
                startDate: previousPeriod.since,
                endDate: previousPeriod.until
              }
            ]
          }
        ]
      };
      
      // Executa as requisições em paralelo
      const [currentResponse, previousResponse] = await Promise.all([
        this.analyticsReporting.reports.batchGet({ requestBody: summaryRequest }),
        this.analyticsReporting.reports.batchGet({ requestBody: previousSummaryRequest })
      ]);
      
      // Processa os resultados
      const currentData = this._extractMetrics(currentResponse.data.reports[0]);
      const previousData = this._extractMetrics(previousResponse.data.reports[0]);
      
      // Calcula as mudanças percentuais
      const result = {
        sessions: parseInt(currentData.sessions || 0),
        users: parseInt(currentData.users || 0),
        newUsers: parseInt(currentData.newUsers || 0),
        sessionsPerUser: parseFloat(currentData.sessionsPerUser || 0),
        pageviews: parseInt(currentData.pageviews || 0),
        pagesPerSession: parseFloat(currentData.pageviewsPerSession || 0),
        avgSessionDuration: parseFloat(currentData.avgSessionDuration || 0),
        bounceRate: parseFloat(currentData.bounceRate || 0),
        goalCompletions: parseInt(currentData.goalCompletionsAll || 0),
        goalConversionRate: parseFloat(currentData.goalConversionRateAll || 0),
        
        // Calcula mudanças percentuais
        sessionsChange: this._calculatePercentChange(currentData.sessions, previousData.sessions),
        usersChange: this._calculatePercentChange(currentData.users, previousData.users),
        newUsersChange: this._calculatePercentChange(currentData.newUsers, previousData.newUsers),
        sessionsPerUserChange: this._calculatePercentChange(currentData.sessionsPerUser, previousData.sessionsPerUser),
        pageviewsChange: this._calculatePercentChange(currentData.pageviews, previousData.pageviews),
        pagesPerSessionChange: this._calculatePercentChange(currentData.pageviewsPerSession, previousData.pageviewsPerSession),
        avgSessionDurationChange: this._calculatePercentChange(currentData.avgSessionDuration, previousData.avgSessionDuration),
        bounceRateChange: this._calculatePercentChange(currentData.bounceRate, previousData.bounceRate),
        goalCompletionsChange: this._calculatePercentChange(currentData.goalCompletionsAll, previousData.goalCompletionsAll),
        goalConversionRateChange: this._calculatePercentChange(currentData.goalConversionRateAll, previousData.goalConversionRateAll)
      };
      
      // Armazena em cache por 1 hora
      await redisClient.set(cacheKey, JSON.stringify(result), 'EX', 3600);
      
      return result;
    } catch (error) {
      logger.error(`Erro ao obter resumo do Google Analytics: ${error.message}`, { stack: error.stack });
      throw error;
    }
  }

  /**
   * Obtém dados de desempenho diário
   * @param {string} startDate - Data de início (YYYY-MM-DD)
   * @param {string} endDate - Data de fim (YYYY-MM-DD)
   * @param {string} clientId - ID do cliente (opcional)
   * @returns {Promise<Array>} Dados de desempenho por dia
   */
  async getPerformance(startDate, endDate, clientId) {
    const cacheKey = `ga_performance_${startDate}_${endDate}_${clientId || 'all'}`;
    
    // Verifica se há dados em cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info('Usando dados em cache para o desempenho do Google Analytics');
      return JSON.parse(cachedData);
    }
    
    try {
      await this._initializeAuth();
      
      // Configura a requisição para obter dados diários
      const performanceRequest = {
        reportRequests: [
          {
            viewId: this.viewId,
            dateRanges: [
              {
                startDate,
                endDate
              }
            ],
            dimensions: [
              { name: 'ga:date' }
            ],
            metrics: [
              { expression: 'ga:sessions' },
              { expression: 'ga:users' },
              { expression: 'ga:pageviews' },
              { expression: 'ga:goalCompletionsAll' }
            ]
          }
        ]
      };
      
      // Adiciona filtro por cliente se necessário
      if (clientId) {
        performanceRequest.reportRequests[0].dimensionFilterClauses = [
          {
            filters: [
              {
                dimensionName: 'ga:dimension1',
                operator: 'EXACT',
                expressions: [clientId]
              }
            ]
          }
        ];
      }
      
      const response = await this.analyticsReporting.reports.batchGet({ requestBody: performanceRequest });
      
      // Processa os resultados
      const report = response.data.reports[0];
      const result = [];
      
      if (report.data.rows) {
        for (const row of report.data.rows) {
          const dateString = row.dimensions[0]; // formato: YYYYMMDD
          const date = DateTime.fromFormat(dateString, 'yyyyMMdd').toFormat('dd/MM');
          
          const metrics = row.metrics[0].values;
          
          result.push({
            date,
            sessions: parseInt(metrics[0] || 0),
            users: parseInt(metrics[1] || 0),
            pageviews: parseInt(metrics[2] || 0),
            goalCompletions: parseInt(metrics[3] || 0)
          });
        }
      }
      
      // Armazena em cache por 1 hora
      await redisClient.set(cacheKey, JSON.stringify(result), 'EX', 3600);
      
      return result;
    } catch (error) {
      logger.error(`Erro ao obter desempenho do Google Analytics: ${error.message}`, { stack: error.stack });
      throw error;
    }
  }

  /**
   * Obtém dados de dispositivos
   * @param {string} startDate - Data de início (YYYY-MM-DD)
   * @param {string} endDate - Data de fim (YYYY-MM-DD)
   * @param {string} clientId - ID do cliente (opcional)
   * @returns {Promise<Array>} Dados de dispositivos
   */
  async getDevices(startDate, endDate, clientId) {
    const cacheKey = `ga_devices_${startDate}_${endDate}_${clientId || 'all'}`;
    
    // Verifica se há dados em cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info('Usando dados em cache para dispositivos do Google Analytics');
      return JSON.parse(cachedData);
    }
    
    try {
      await this._initializeAuth();
      
      // Configura a requisição para obter dados de dispositivos
      const devicesRequest = {
        reportRequests: [
          {
            viewId: this.viewId,
            dateRanges: [
              {
                startDate,
                endDate
              }
            ],
            dimensions: [
              { name: 'ga:deviceCategory' }
            ],
            metrics: [
              { expression: 'ga:sessions' }
            ]
          }
        ]
      };
      
      // Adiciona filtro por cliente se necessário
      if (clientId) {
        devicesRequest.reportRequests[0].dimensionFilterClauses = [
          {
            filters: [
              {
                dimensionName: 'ga:dimension1',
                operator: 'EXACT',
                expressions: [clientId]
              }
            ]
          }
        ];
      }
      
      const response = await this.analyticsReporting.reports.batchGet({ requestBody: devicesRequest });
      
      // Processa os resultados
      const report = response.data.reports[0];
      const result = [];
      
      if (report.data.rows) {
        // Calcula o total de sessões para obter a porcentagem
        const totalSessions = report.data.rows.reduce((sum, row) => sum + parseInt(row.metrics[0].values[0]), 0);
        
        for (const row of report.data.rows) {
          const deviceCategory = row.dimensions[0];
          const sessions = parseInt(row.metrics[0].values[0]);
          const percentage = totalSessions > 0 ? Math.round((sessions / totalSessions) * 100) : 0;
          
          result.push({
            name: deviceCategory.charAt(0).toUpperCase() + deviceCategory.slice(1), // Capitalize
            value: percentage
          });
        }
      }
      
      // Armazena em cache por 1 hora
      await redisClient.set(cacheKey, JSON.stringify(result), 'EX', 3600);
      
      return result;
    } catch (error) {
      logger.error(`Erro ao obter dados de dispositivos do Google Analytics: ${error.message}`, { stack: error.stack });
      throw error;
    }
  }

  /**
   * Obtém dados de fontes de tráfego
   * @param {string} startDate - Data de início (YYYY-MM-DD)
   * @param {string} endDate - Data de fim (YYYY-MM-DD)
   * @param {string} clientId - ID do cliente (opcional)
   * @returns {Promise<Array>} Dados de fontes de tráfego
   */
  async getTrafficSources(startDate, endDate, clientId) {
    const cacheKey = `ga_traffic_${startDate}_${endDate}_${clientId || 'all'}`;
    
    // Verifica se há dados em cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info('Usando dados em cache para fontes de tráfego do Google Analytics');
      return JSON.parse(cachedData);
    }
    
    try {
      await this._initializeAuth();
      
      // Configura a requisição para obter dados de fontes de tráfego
      const trafficRequest = {
        reportRequests: [
          {
            viewId: this.viewId,
            dateRanges: [
              {
                startDate,
                endDate
              }
            ],
            dimensions: [
              { name: 'ga:channelGrouping' }
            ],
            metrics: [
              { expression: 'ga:sessions' }
            ],
            orderBys: [
              {
                fieldName: 'ga:sessions',
                sortOrder: 'DESCENDING'
              }
            ]
          }
        ]
      };
      
      // Adiciona filtro por cliente se necessário
      if (clientId) {
        trafficRequest.reportRequests[0].dimensionFilterClauses = [
          {
            filters: [
              {
                dimensionName: 'ga:dimension1',
                operator: 'EXACT',
                expressions: [clientId]
              }
            ]
          }
        ];
      }
      
      const response = await this.analyticsReporting.reports.batchGet({ requestBody: trafficRequest });
      
      // Processa os resultados
      const report = response.data.reports[0];
      let result = [];
      
      if (report.data.rows) {
        // Calcula o total de sessões para obter a porcentagem
        const totalSessions = report.data.rows.reduce((sum, row) => sum + parseInt(row.metrics[0].values[0]), 0);
        
        // Mapeia os canais para nomes em português e calcula porcentagens
        const channelMap = {
          'Organic Search': 'Orgânico',
          'Direct': 'Direto',
          'Social': 'Social',
          'Referral': 'Referência',
          'Email': 'Email',
          'Paid Search': 'Busca Paga',
          'Display': 'Display',
          'Affiliates': 'Afiliados',
          'Other': 'Outros'
        };
        
        result = report.data.rows.map(row => {
          const channel = row.dimensions[0];
          const sessions = parseInt(row.metrics[0].values[0]);
          const percentage = totalSessions > 0 ? Math.round((sessions / totalSessions) * 100) : 0;
          
          return {
            name: channelMap[channel] || channel,
            value: percentage
          };
        });
        
        // Limitamos aos top 5 canais e agregamos o resto como "Outros"
        if (result.length > 5) {
          const topChannels = result.slice(0, 5);
          const otherChannels = result.slice(5);
          
          const othersValue = otherChannels.reduce((sum, channel) => sum + channel.value, 0);
          
          result = [
            ...topChannels,
            { name: 'Outros', value: othersValue }
          ];
        }
      }
      
      // Armazena em cache por 1 hora
      await redisClient.set(cacheKey, JSON.stringify(result), 'EX', 3600);
      
      return result;
    } catch (error) {
      logger.error(`Erro ao obter fontes de tráfego do Google Analytics: ${error.message}`, { stack: error.stack });
      throw error;
    }
  }

  /**
   * Obtém dados geográficos
   * @param {string} startDate - Data de início (YYYY-MM-DD)
   * @param {string} endDate - Data de fim (YYYY-MM-DD)
   * @param {string} clientId - ID do cliente (opcional)
   * @returns {Promise<Array>} Dados geográficos
   */
  async getGeography(startDate, endDate, clientId) {
    const cacheKey = `ga_geography_${startDate}_${endDate}_${clientId || 'all'}`;
    
    // Verifica se há dados em cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info('Usando dados em cache para geografia do Google Analytics');
      return JSON.parse(cachedData);
    }
    
    try {
      await this._initializeAuth();
      
      // Configura a requisição para obter dados geográficos
      const geoRequest = {
        reportRequests: [
          {
            viewId: this.viewId,
            dateRanges: [
              {
                startDate,
                endDate
              }
            ],
            dimensions: [
              { name: 'ga:country' }
            ],
            metrics: [
              { expression: 'ga:users' }
            ],
            orderBys: [
              {
                fieldName: 'ga:users',
                sortOrder: 'DESCENDING'
              }
            ]
          }
        ]
      };
      
      // Adiciona filtro por cliente se necessário
      if (clientId) {
        geoRequest.reportRequests[0].dimensionFilterClauses = [
          {
            filters: [
              {
                dimensionName: 'ga:dimension1',
                operator: 'EXACT',
                expressions: [clientId]
              }
            ]
          }
        ];
      }
      
      const response = await this.analyticsReporting.reports.batchGet({ requestBody: geoRequest });
      
      // Processa os resultados
      const report = response.data.reports[0];
      let result = [];
      
      if (report.data.rows) {
        // Calcula o total de usuários para obter a porcentagem
        const totalUsers = report.data.rows.reduce((sum, row) => sum + parseInt(row.metrics[0].values[0]), 0);
        
        // Mapeia países para nomes em português
        const countryMap = {
          'Brazil': 'Brasil',
          'United States': 'Estados Unidos',
          'Portugal': 'Portugal',
          'Spain': 'Espanha',
          'Argentina': 'Argentina',
          'Mexico': 'México',
          'Chile': 'Chile',
          'Colombia': 'Colômbia',
          'Peru': 'Peru',
          'France': 'França',
          'Germany': 'Alemanha',
          'United Kingdom': 'Reino Unido'
        };
        
        result = report.data.rows.map(row => {
          const country = row.dimensions[0];
          const users = parseInt(row.metrics[0].values[0]);
          const percentage = totalUsers > 0 ? Math.round((users / totalUsers) * 100) : 0;
          
          return {
            country: countryMap[country] || country,
            value: percentage
          };
        });
        
        // Limitamos aos top 5 países e agregamos o resto como "Outros"
        if (result.length > 5) {
          const topCountries = result.slice(0, 5);
          const otherCountries = result.slice(5);
          
          const othersValue = otherCountries.reduce((sum, country) => sum + country.value, 0);
          
          result = [
            ...topCountries,
            { country: 'Outros', value: othersValue }
          ];
        }
      }
      
      // Armazena em cache por 1 hora
      await redisClient.set(cacheKey, JSON.stringify(result), 'EX', 3600);
      
      return result;
    } catch (error) {
      logger.error(`Erro ao obter dados geográficos do Google Analytics: ${error.message}`, { stack: error.stack });
      throw error;
    }
  }

  /**
   * Métodos auxiliares
   */

  /**
   * Extrai métricas de um relatório
   * @param {Object} report - Relatório da API do Google Analytics
   * @returns {Object} Métricas extraídas
   * @private
   */
  _extractMetrics(report) {
    if (!report.data || !report.data.rows || !report.data.rows.length) {
      return {};
    }
    
    const metricValues = report.data.rows[0].metrics[0].values;
    const metricHeaders = report.columnHeader.metricHeader.metricHeaderEntries;
    
    const results = {};
    metricHeaders.forEach((header, index) => {
      const name = header.name.replace('ga:', '');
      results[name] = metricValues[index];
    });
    
    return results;
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
   * Obtém o período anterior para comparações
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
}

module.exports = new GoogleAnalyticsService();
