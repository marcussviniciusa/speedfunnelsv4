/**
 * Script para testar a conexão com as APIs do Google Analytics e Meta Ads
 * Execute com: node src/scripts/test-analytics-connections.js
 */
require('dotenv').config();
const gaService = require('../services/ga.service');
const metaAdsService = require('../services/meta-ads.service');
const { google } = require('googleapis');
const config = require('../config/config');

async function testGoogleAuthentication() {
  console.log('\n==== Testando Autenticação Google OAuth2 ====');
  
  try {
    const oauth2Client = new google.auth.OAuth2(
      config.googleAuth.clientId,
      config.googleAuth.clientSecret,
      config.googleAuth.redirectUrl
    );
    
    // Gera uma URL de autenticação para testes
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/analytics.readonly',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      prompt: 'consent'
    });
    
    console.log('✅ Configuração do OAuth2 do Google está correta');
    console.log(`URL de autenticação: ${authUrl}`);
    
    return true;
  } catch (error) {
    console.error('❌ Erro na configuração do OAuth2 do Google:', error.message);
    return false;
  }
}

async function testGoogleAnalytics() {
  console.log('\n==== Testando Conexão com Google Analytics ====');
  
  try {
    // Verifica se as credenciais estão configuradas
    if (!config.googleAnalytics.viewId || 
        !config.googleAnalytics.clientEmail || 
        !config.googleAnalytics.privateKey) {
      console.error('❌ Credenciais do Google Analytics não configuradas');
      return false;
    }
    
    // Obtém a data atual e a de 7 dias atrás para o teste
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    // Formata as datas no formato YYYY-MM-DD
    const endDate = today.toISOString().split('T')[0];
    const startDate = sevenDaysAgo.toISOString().split('T')[0];
    
    console.log(`Período de teste: ${startDate} até ${endDate}`);
    
    // Testa a inicialização da autenticação
    await gaService._initializeAuth();
    console.log('✅ Autenticação com Google Analytics inicializada com sucesso');
    
    // Testa a obtenção de dados resumidos
    const summary = await gaService.getSummary(startDate, endDate);
    console.log('✅ Dados resumidos obtidos com sucesso');
    console.log(`Sessions: ${summary.sessions}, Users: ${summary.users}, Pageviews: ${summary.pageviews}`);
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao testar conexão com Google Analytics:', error.message);
    console.error(error.stack);
    return false;
  }
}

async function testMetaAds() {
  console.log('\n==== Testando Conexão com Meta Ads ====');
  
  try {
    // Verifica se as credenciais estão configuradas
    if (!config.meta.accessToken || !config.meta.adAccountId) {
      console.error('❌ Credenciais do Meta Ads não configuradas');
      return false;
    }
    
    // Obtém a data atual e a de 7 dias atrás para o teste
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    // Formata as datas no formato YYYY-MM-DD
    const endDate = today.toISOString().split('T')[0];
    const startDate = sevenDaysAgo.toISOString().split('T')[0];
    
    console.log(`Período de teste: ${startDate} até ${endDate}`);
    
    // Testa a obtenção de dados resumidos
    const summary = await metaAdsService.getSummary(startDate, endDate);
    console.log('✅ Dados resumidos obtidos com sucesso');
    console.log(`Impressions: ${summary.impressions}, Clicks: ${summary.clicks}, Spend: ${summary.spend}`);
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao testar conexão com Meta Ads:', error.message);
    console.error(error.stack);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Iniciando testes de conexão com APIs de Analytics...');
  
  // Testa a autenticação Google OAuth2
  const googleAuthOk = await testGoogleAuthentication();
  
  // Testa a conexão com Google Analytics
  const gaOk = await testGoogleAnalytics();
  
  // Testa a conexão com Meta Ads
  const metaAdsOk = await testMetaAds();
  
  // Exibe o resumo dos testes
  console.log('\n==== Resumo dos Testes ====');
  console.log(`Google OAuth2: ${googleAuthOk ? '✅ OK' : '❌ Falhou'}`);
  console.log(`Google Analytics: ${gaOk ? '✅ OK' : '❌ Falhou'}`);
  console.log(`Meta Ads: ${metaAdsOk ? '✅ OK' : '❌ Falhou'}`);
  
  console.log('\nTestes concluídos!');
}

// Executa os testes
runTests().catch(error => {
  console.error('Erro ao executar testes:', error);
});
