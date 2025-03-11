/**
 * Configurações específicas para as integrações com Analytics
 */
const config = require('./config');

module.exports = {
  /**
   * Configurações para Google Analytics
   */
  googleAnalytics: {
    // Configurações gerais do GA
    viewId: config.googleAnalytics.viewId,
    clientEmail: config.googleAnalytics.clientEmail,
    privateKey: config.googleAnalytics.privateKey,
    
    // Escopos necessários para a API do Google Analytics
    scopes: [
      'https://www.googleapis.com/auth/analytics.readonly'
    ],
    
    // Dimensões comuns usadas nas consultas
    dimensions: {
      date: 'ga:date',
      source: 'ga:source',
      medium: 'ga:medium',
      campaign: 'ga:campaign',
      pagePath: 'ga:pagePath',
      pageTitle: 'ga:pageTitle',
      userType: 'ga:userType',
      deviceCategory: 'ga:deviceCategory',
      country: 'ga:country',
      city: 'ga:city',
      clientId: 'ga:dimension1' // Assumindo que o client ID está na dimensão personalizada 1
    },
    
    // Métricas comuns usadas nas consultas
    metrics: {
      sessions: 'ga:sessions',
      users: 'ga:users',
      newUsers: 'ga:newUsers',
      pageviews: 'ga:pageviews',
      pageviewsPerSession: 'ga:pageviewsPerSession',
      avgSessionDuration: 'ga:avgSessionDuration',
      bounceRate: 'ga:bounceRate',
      goalCompletionsAll: 'ga:goalCompletionsAll',
      goalConversionRateAll: 'ga:goalConversionRateAll'
    }
  },
  
  /**
   * Configurações para Meta Ads
   */
  metaAds: {
    // Versão da API do Meta
    apiVersion: 'v18.0',
    
    // Configurações de acesso
    accessToken: config.meta.accessToken,
    adAccountId: config.meta.adAccountId,
    
    // Campos comuns para consultas
    fields: {
      // Campos para campanhas
      campaigns: [
        'id',
        'name',
        'status',
        'objective',
        'daily_budget',
        'lifetime_budget',
        'start_time',
        'stop_time'
      ],
      
      // Campos para conjuntos de anúncios
      adSets: [
        'id',
        'name',
        'status',
        'campaign_id',
        'daily_budget',
        'lifetime_budget',
        'targeting',
        'bid_amount'
      ],
      
      // Campos para anúncios
      ads: [
        'id',
        'name',
        'status',
        'adset_id',
        'campaign_id',
        'creative',
        'preview_url'
      ],
      
      // Métricas para insights
      insights: [
        'impressions',
        'clicks',
        'ctr',
        'spend',
        'cpc',
        'conversions',
        'cost_per_conversion',
        'conversion_rate',
        'roas'
      ]
    }
  },
  
  // Configurações de cache
  cache: {
    // Tempo de vida (TTL) para resultados em cache (em segundos)
    ttl: {
      summary: 3600, // 1 hora
      performance: 3600,
      campaigns: 7200, // 2 horas
      adSets: 7200,
      ads: 7200,
      trafficSources: 3600,
      topPages: 3600,
      demographics: 7200,
      events: 3600
    }
  }
};
