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
    
    // Sincronizar modelos com o banco de dados (criar tabelas se não existirem)
    await sequelize.sync();
    logger.info('Database models synchronized');

    // Get all active business accounts with OAuth connections
    const { BusinessAccount } = require('./models/business-account.model');
    const businessAccounts = await BusinessAccount.findAll({
      where: { isConnected: true }
    });

    logger.info(`Found ${businessAccounts.length} active business accounts`);

    // Process each business account
    for (const businessAccount of businessAccounts) {
      logger.info(`Processing business account: ${businessAccount.accountName} (${businessAccount.id})`);
      
      // Process based on provider type
      if (businessAccount.provider === 'meta') {
        try {
          await metaEtl.processBusinessAccount(businessAccount);
          logger.info(`Completed Meta Ads ETL for business account: ${businessAccount.accountName}`);
        } catch (error) {
          logger.error(`Error processing Meta Ads for business account ${businessAccount.accountName}: ${error.message}`);
        }
      } else if (businessAccount.provider === 'google') {
        // Process Google Analytics data
        try {
          await gaEtl.processBusinessAccount(businessAccount);
          logger.info(`Completed Google Analytics ETL for business account: ${businessAccount.accountName}`);
        } catch (error) {
          logger.error(`Error processing Google Analytics for business account ${businessAccount.accountName}: ${error.message}`);
        }
      } else {
        logger.info(`Unknown provider type for business account: ${businessAccount.accountName}, skipping`);
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
