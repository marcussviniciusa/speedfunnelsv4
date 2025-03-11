const express = require('express');
const router = express.Router();
// Middleware de autenticação compatível com OAuth 2.0
const { authMiddleware } = require('../middlewares/auth.middleware');
const metaAdsController = require('../controllers/meta-ads.controller');
const gaController = require('../controllers/ga.controller');

/**
 * Rotas para Meta Ads
 */
router.get('/meta-ads/summary', authMiddleware, metaAdsController.getSummary);
router.get('/meta-ads/performance', authMiddleware, metaAdsController.getPerformance);
router.get('/meta-ads/campaigns', authMiddleware, metaAdsController.getCampaigns);
router.get('/meta-ads/adsets', authMiddleware, metaAdsController.getAdSets);
router.get('/meta-ads/ads', authMiddleware, metaAdsController.getAds);

/**
 * Rotas para Google Analytics
 */
router.get('/ga/summary', authMiddleware, gaController.getSummary);
router.get('/ga/performance', authMiddleware, gaController.getPerformance);
router.get('/ga/devices', authMiddleware, gaController.getDevices);
router.get('/ga/traffic', authMiddleware, gaController.getTrafficSources);
router.get('/ga/geography', authMiddleware, gaController.getGeography);

module.exports = router;
