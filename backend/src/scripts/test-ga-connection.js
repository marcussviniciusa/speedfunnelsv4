/**
 * Script para testar a conexão com a API do Google Analytics
 * Execute com: node src/scripts/test-ga-connection.js
 */
require('dotenv').config();
const gaService = require('../services/ga.service');
const logger = require('../utils/logger');

async function testGoogleAnalyticsConnection() {
  try {
    console.log('Iniciando teste de conexão com Google Analytics...');
    
    // Obtém a data atual e a de 30 dias atrás para o teste
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    // Formata as datas no formato YYYY-MM-DD
    const endDate = today.toISOString().split('T')[0];
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];
    
    console.log(`Período de teste: ${startDate} até ${endDate}`);
    
    // Testa a obtenção de dados resumidos
    const summary = await gaService.getSummary(startDate, endDate);
    console.log('\n==== Resumo do Google Analytics ====');
    console.log(JSON.stringify(summary, null, 2));
    
    // Testa a obtenção de fontes de tráfego (se o método existir)
    if (typeof gaService.getTrafficSources === 'function') {
      const sources = await gaService.getTrafficSources(startDate, endDate);
      console.log('\n==== Fontes de Tráfego ====');
      console.log(JSON.stringify(sources.slice(0, 5), null, 2)); // Exibe apenas as 5 primeiras fontes
    }
    
    // Testa a obtenção de páginas mais visitadas (se o método existir)
    if (typeof gaService.getTopPages === 'function') {
      const pages = await gaService.getTopPages(startDate, endDate, null, 5);
      console.log('\n==== Páginas Mais Visitadas ====');
      console.log(JSON.stringify(pages, null, 2));
    }
    
    console.log('\nTeste de conexão com Google Analytics concluído com sucesso!');
  } catch (error) {
    console.error('Erro ao testar conexão com Google Analytics:');
    console.error(error.message);
    console.error(error.stack);
  }
}

// Executa o teste
testGoogleAnalyticsConnection();
