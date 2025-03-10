require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { sequelize } = require('./config/database');
const routes = require('./routes');
const logger = require('./utils/logger');
const { initRedis, closeRedis } = require('./utils/redis');
const config = require('./config/config');

// Initialize Express app
const app = express();
const PORT = config.server.port;

// Apply middlewares
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('combined', { stream: logger.stream })); // HTTP request logger

// API routes
app.use('/api', routes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`${err.message}`, { stack: err.stack });
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Handle shutdown gracefully
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received, closing HTTP server and connections');
  await closeRedis();
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Initialize Redis
    await initRedis();
    logger.info('Redis connection initialized');
    
    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully');
    
    // Sync database models (in development)
    if (config.server.env === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('Database models synchronized');
    }
    
    // Start the server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${config.server.env} mode`);
    });
  } catch (error) {
    logger.error(`Unable to connect to the database or start server: ${error.message}`, { stack: error.stack });
    process.exit(1);
  }
}

startServer();
