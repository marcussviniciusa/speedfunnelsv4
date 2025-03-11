const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const analyticsRoutes = require('./analytics.routes');
const googleAnalyticsRoutes = require('./google-analytics.routes');
const metaAdsRoutes = require('./meta-ads.routes');
const metaBusinessAuthRoutes = require('./meta-business-auth.routes');

// Setup routes
router.use('/auth', authRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/google-analytics', googleAnalyticsRoutes);
router.use('/meta-ads', metaAdsRoutes);
router.use('/meta-business-auth', metaBusinessAuthRoutes);

// API version and info
router.get('/', (req, res) => {
  res.json({
    name: 'SpeedFunnels API',
    version: '4.0.0',
    status: 'active'
  });
});

module.exports = router;
