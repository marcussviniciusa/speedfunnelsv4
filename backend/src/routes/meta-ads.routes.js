const express = require('express');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { validateDateParams, checkMetaAdsCredentials } = require('../middlewares/analytics.middleware');
const metaAdsController = require('../controllers/meta-ads.controller');

const router = express.Router();

// Todas as rotas exigem autenticação
router.use(authMiddleware);

// Todas as rotas exigem credenciais do Meta Ads configuradas
router.use(checkMetaAdsCredentials);

// Rota para obter o resumo de métricas
router.get('/summary', validateDateParams, metaAdsController.getSummary);

// Rota para obter dados de desempenho diário
router.get('/performance', validateDateParams, metaAdsController.getPerformance);

// Rota para obter listagem de campanhas
router.get('/campaigns', validateDateParams, metaAdsController.getCampaigns);

// Rota para obter conjuntos de anúncios
router.get('/adsets', validateDateParams, metaAdsController.getAdSets);

// Rota para obter anúncios
router.get('/ads', validateDateParams, metaAdsController.getAds);

module.exports = router;
