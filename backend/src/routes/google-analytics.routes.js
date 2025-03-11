const express = require('express');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { validateDateParams, checkGoogleAnalyticsCredentials } = require('../middlewares/analytics.middleware');
const gaController = require('../controllers/google-analytics.controller');

const router = express.Router();

// Todas as rotas exigem autenticação
router.use(authMiddleware);

// Todas as rotas exigem credenciais do Google Analytics configuradas
router.use(checkGoogleAnalyticsCredentials);

// Rota para obter o resumo de métricas
router.get('/summary', validateDateParams, gaController.getSummary);

// Rota para obter dados de desempenho diário
router.get('/performance', validateDateParams, gaController.getPerformance);

// Rota para obter fontes de tráfego
router.get('/traffic-sources', validateDateParams, gaController.getTrafficSources);

// Rota para obter páginas mais visitadas
router.get('/top-pages', validateDateParams, gaController.getTopPages);

// Rota para obter dados demográficos
router.get('/demographics', validateDateParams, gaController.getDemographics);

// Rota para obter dados de eventos
router.get('/events', validateDateParams, gaController.getEvents);

module.exports = router;
