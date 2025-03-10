const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const clientRoutes = require('./client.routes');
const dashboardRoutes = require('./dashboard.routes');
const analyticsRoutes = require('./analytics.routes');

// Setup routes
router.use('/auth', authRoutes);
router.use('/clients', clientRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/analytics', analyticsRoutes);

// API version and info
router.get('/', (req, res) => {
  res.json({
    name: 'SpeedFunnels API',
    version: '4.0.0',
    status: 'active'
  });
});

module.exports = router;
