/**
 * Script para testar a conexão com a API do Meta Ads
 * Execute com: node src/scripts/test-meta-ads-connection.js
 */
require('dotenv').config();
const metaAdsService = require('../services/meta-ads.service');
const logger = require('../utils/logger');

async function testMetaAdsConnection() {
  try {
    console.log('Iniciando teste de conexão com Meta Ads...');
    
    // Obtém a data atual e a de 30 dias atrás para o teste
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    // Formata as datas no formato YYYY-MM-DD
    const endDate = today.toISOString().split('T')[0];
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];
    
    console.log(`Período de teste: ${startDate} até ${endDate}`);
    
    // Testa a obtenção de dados resumidos
    const summary = await metaAdsService.getSummary(startDate, endDate);
    console.log('\n==== Resumo do Meta Ads ====');
    console.log(JSON.stringify(summary, null, 2));
    
    // Testa a obtenção de campanhas
    const campaigns = await metaAdsService.getCampaigns(startDate, endDate);
    console.log('\n==== Campanhas ====');
    console.log(JSON.stringify(campaigns.slice(0, 3), null, 2)); // Exibe apenas as 3 primeiras campanhas
    
    // Testa a obtenção de conjuntos de anúncios (se houver campanhas)
    if (campaigns.length > 0) {
      const campaignId = campaigns[0].id;
      const adSets = await metaAdsService.getAdSets(startDate, endDate, null, campaignId);
      console.log(`\n==== Conjuntos de Anúncios (Campanha: ${campaignId}) ====`);
      console.log(JSON.stringify(adSets.slice(0, 3), null, 2)); // Exibe apenas os 3 primeiros conjuntos
      
      // Testa a obtenção de anúncios (se houver conjuntos de anúncios)
      if (adSets.length > 0) {
        const adSetId = adSets[0].id;
        const ads = await metaAdsService.getAds(startDate, endDate, null, campaignId, adSetId);
        console.log(`\n==== Anúncios (Conjunto: ${adSetId}) ====`);
        console.log(JSON.stringify(ads.slice(0, 3), null, 2)); // Exibe apenas os 3 primeiros anúncios
      }
    }
    
    console.log('\nTeste de conexão com Meta Ads concluído com sucesso!');
  } catch (error) {
    console.error('Erro ao testar conexão com Meta Ads:');
    console.error(error.message);
    console.error(error.stack);
  }
}

// Executa o teste
testMetaAdsConnection();
