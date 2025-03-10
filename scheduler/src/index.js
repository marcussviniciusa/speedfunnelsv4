require('dotenv').config();
const cron = require('node-cron');
const axios = require('axios');
const logger = require('./utils/logger');

// Configuração do serviço de ETL
const ETL_SERVICE_URL = process.env.ETL_SERVICE_URL || 'http://etl:3000';

/**
 * Executa o processo de ETL
 */
async function runEtlProcess() {
  try {
    logger.info('Iniciando o processo de ETL agendado');
    
    // Chama o endpoint do serviço ETL para iniciar o processamento
    const response = await axios.post(`${ETL_SERVICE_URL}/process`);
    
    if (response.status === 200) {
      logger.info(`Processo de ETL iniciado com sucesso: ${JSON.stringify(response.data)}`);
    } else {
      logger.warn(`Processo de ETL retornou status inesperado: ${response.status}`);
    }
  } catch (error) {
    logger.error(`Erro ao executar o processo de ETL: ${error.message}`);
  }
}

/**
 * Configurações de agendamento
 */
const schedules = {
  // Execução diária às 3:00 AM
  daily: '0 3 * * *',
  
  // Execução a cada hora (para dados críticos ou de alta frequência)
  hourly: '0 * * * *',
  
  // Execução a cada 15 minutos (uso em desenvolvimento/testes)
  frequent: '*/15 * * * *'
};

/**
 * Inicializa os agendamentos
 */
function initSchedules() {
  logger.info('Inicializando agendamentos');
  
  // Agendamento diário para processamento principal
  cron.schedule(schedules.daily, async () => {
    logger.info('Executando processamento ETL diário');
    await runEtlProcess();
  });
  
  // Agendamento para teste/desenvolvimento (desativado em produção)
  if (process.env.NODE_ENV !== 'production') {
    cron.schedule(schedules.frequent, async () => {
      logger.info('Executando processamento ETL de teste (somente em ambiente de desenvolvimento)');
      await runEtlProcess();
    });
  }
  
  logger.info('Todos os agendamentos foram inicializados');
}

/**
 * Executa o processo ETL manualmente (para testes)
 */
async function manualRun() {
  logger.info('Iniciando execução manual do processo ETL');
  await runEtlProcess();
  logger.info('Execução manual concluída');
}

// Inicializa o agendador
initSchedules();

// Executa uma vez ao iniciar (opcional)
if (process.env.RUN_ON_STARTUP === 'true') {
  logger.info('Configurado para executar no início. Iniciando processamento ETL...');
  manualRun();
}

logger.info('Serviço de agendamento iniciado com sucesso');

// Expor funções para uso externo
module.exports = {
  runEtlProcess,
  manualRun,
  schedules
};
