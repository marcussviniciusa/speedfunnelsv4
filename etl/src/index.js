require('dotenv').config();
const { sequelize } = require('./config/database');
const logger = require('./utils/logger');
const metaEtl = require('./tasks/meta-etl');
const gaEtl = require('./tasks/ga-etl');

// Run ETL process
async function runEtl() {
  try {
    // Initialize database connection
    await sequelize.authenticate();
    logger.info('Database connection established');

    // Get all active clients
    const { Client } = require('./models/client.model');
    const clients = await Client.findAll({
      where: { active: true },
      include: [
        { model: sequelize.models.MetaCredential, where: { active: true }, required: false },
        { model: sequelize.models.GoogleAnalyticsCredential, where: { active: true }, required: false }
      ]
    });

    logger.info(`Found ${clients.length} active clients`);

    // Process each client
    for (const client of clients) {
      logger.info(`Processing client: ${client.name} (${client.id})`);
      
      // Process Meta Ads data if credentials exist
      if (client.MetaCredential) {
        try {
          await metaEtl.processClient(client);
          logger.info(`Completed Meta Ads ETL for client: ${client.name}`);
        } catch (error) {
          logger.error(`Error processing Meta Ads for client ${client.name}: ${error.message}`);
        }
      } else {
        logger.info(`No Meta Ads credentials for client: ${client.name}, skipping`);
      }
      
      // Process Google Analytics data if credentials exist
      if (client.GoogleAnalyticsCredential) {
        try {
          await gaEtl.processClient(client);
          logger.info(`Completed Google Analytics ETL for client: ${client.name}`);
        } catch (error) {
          logger.error(`Error processing Google Analytics for client ${client.name}: ${error.message}`);
        }
      } else {
        logger.info(`No Google Analytics credentials for client: ${client.name}, skipping`);
      }
    }
    
    logger.info('ETL process completed successfully');
  } catch (error) {
    logger.error(`ETL process failed: ${error.message}`);
    logger.error(error.stack);
  }
}

// If running as a standalone script
if (require.main === module) {
  runEtl()
    .then(() => process.exit(0))
    .catch(error => {
      logger.error(`Unhandled error: ${error.message}`);
      logger.error(error.stack);
      process.exit(1);
    });
}

module.exports = { runEtl };
