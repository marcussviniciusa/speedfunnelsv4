const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const metaAdsController = require('../controllers/meta-ads.controller');
const gaController = require('../controllers/ga.controller');

/**
 * Rotas para Meta Ads
 */
router.get('/meta-ads/summary', authenticate, metaAdsController.getSummary);
router.get('/meta-ads/performance', authenticate, metaAdsController.getPerformance);
router.get('/meta-ads/campaigns', authenticate, metaAdsController.getCampaigns);
router.get('/meta-ads/adsets', authenticate, metaAdsController.getAdSets);
router.get('/meta-ads/ads', authenticate, metaAdsController.getAds);

/**
 * Rotas para Google Analytics
 */
router.get('/ga/summary', authenticate, gaController.getSummary);
router.get('/ga/performance', authenticate, gaController.getPerformance);
router.get('/ga/devices', authenticate, gaController.getDevices);
router.get('/ga/traffic', authenticate, gaController.getTrafficSources);
router.get('/ga/geography', authenticate, gaController.getGeography);

module.exports = router;
