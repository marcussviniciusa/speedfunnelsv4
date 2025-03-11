const moment = require('moment');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');
const gaService = require('../services/ga-service');

// Load models
const { BusinessAccount } = require('../models/business-account.model');
const { 
  GASite, 
  GAPerformance, 
  GAFunnel, 
  GAFunnelPerformance 
} = require('../models/google-analytics.model');

/**
 * Process Google Analytics data for a specific business account
 * @param {Object} businessAccount - BusinessAccount model instance
 */
async function processBusinessAccount(businessAccount) {
  logger.info(`Starting Google Analytics ETL for business account: ${businessAccount.accountName}`);
  // Com OAuth, o próprio businessAccount contém as credenciais do Google Analytics
  const accessToken = businessAccount.accessToken;
  
  if (!accessToken || !businessAccount.accountData || !businessAccount.accountData.propertyId) {
    logger.error(`No valid Google Analytics credentials for business account: ${businessAccount.accountName}`);
    return;
  }
  
  const propertyId = businessAccount.accountData.propertyId;
  
  try {
    // Initialize Google Analytics service with business account credentials
    await gaService.initialize({ accessToken, propertyId });
    
    // Process site information
    await processSiteInfo(businessAccount, { accessToken, propertyId });
    
    // Process performance data
    await processPerformanceData(businessAccount);
    
    // Process funnel data if any funnels are configured
    await processFunnelData(businessAccount);
    
    logger.info(`Completed Google Analytics ETL for business account: ${businessAccount.accountName}`);
  } catch (error) {
    logger.error(`Error in Google Analytics ETL for business account ${businessAccount.accountName}: ${error.message}`);
    throw error;
  }
}

/**
 * Process site information
 * @param {Object} businessAccount - BusinessAccount model instance
 * @param {Object} credentials - Google Analytics credentials
 */
async function processSiteInfo(businessAccount, credentials) {
  logger.info(`Processing site information for business account: ${businessAccount.accountName}`);
  
  try {
    // Get site information from Google Analytics API
    const siteInfo = await gaService.getSiteInfo(credentials.propertyId);
    
    // Find or create site record
    const [site, created] = await GASite.findOrCreate({
      where: {
        propertyId: credentials.propertyId,
        businessAccountId: businessAccount.id
      },
      defaults: {
        siteName: siteInfo.name || `Site ${credentials.propertyId}`,
        siteUrl: siteInfo.url,
        metaData: siteInfo
      }
    });
    
    // Update site if it exists
    if (!created) {
      await site.update({
        siteName: siteInfo.name || `Site ${credentials.propertyId}`,
        siteUrl: siteInfo.url,
        metaData: siteInfo
      });
    }
    
    logger.info(`Completed processing site information for business account: ${businessAccount.accountName}`);
  } catch (error) {
    logger.error(`Error processing site information: ${error.message}`);
    throw error;
  }
}

/**
 * Process performance data for all sites
 * @param {Object} businessAccount - BusinessAccount model instance
 */
async function processPerformanceData(businessAccount) {
  logger.info(`Processing performance data for business account: ${businessAccount.accountName}`);
  
  try {
    // Get all sites for this business account
    const sites = await GASite.findAll({
      where: { businessAccountId: businessAccount.id }
    });
    
    // Define date range (last 30 days by default)
    const endDate = moment().subtract(1, 'days').format('YYYY-MM-DD');
    const startDate = moment().subtract(30, 'days').format('YYYY-MM-DD');
    
    // Process each site
    for (const site of sites) {
      // Get main metrics from Google Analytics API
      const metrics = await gaService.getMetrics(site.propertyId, startDate, endDate);
      logger.info(`Retrieved metrics for site ${site.name} (${site.propertyId})`);
      
      // Process each day's data
      for (const metricData of metrics) {
        const date = metricData.date;
        
        // Find or create performance record
        const [performance, created] = await GAPerformance.findOrCreate({
          where: {
            date,
            GASiteId: site.id,
            filter: metricData.filter || 'all'
          },
          defaults: {
            sessions: metricData.sessions || 0,
            users: metricData.users || 0,
            newUsers: metricData.newUsers || 0,
            pageviews: metricData.pageviews || 0,
            avgSessionDuration: metricData.avgSessionDuration || 0,
            bounceRate: metricData.bounceRate || 0,
            pagesPerSession: metricData.pagesPerSession || 0,
            trafficSource: metricData.trafficSource || {},
            goalCompletions: metricData.goalCompletions || 0,
            goalConversionRate: metricData.goalConversionRate || 0,
            goalValue: metricData.goalValue || 0,
            transactions: metricData.transactions || 0,
            revenue: metricData.revenue || 0,
            averageOrderValue: metricData.averageOrderValue || 0,
            deviceCategory: metricData.deviceCategory || {},
            countryData: metricData.countryData || {},
            sourceData: metricData
          }
        });
        
        // Update record if it exists
        if (!created) {
          await performance.update({
            sessions: metricData.sessions || 0,
            users: metricData.users || 0,
            newUsers: metricData.newUsers || 0,
            pageviews: metricData.pageviews || 0,
            avgSessionDuration: metricData.avgSessionDuration || 0,
            bounceRate: metricData.bounceRate || 0,
            pagesPerSession: metricData.pagesPerSession || 0,
            trafficSource: metricData.trafficSource || {},
            goalCompletions: metricData.goalCompletions || 0,
            goalConversionRate: metricData.goalConversionRate || 0,
            goalValue: metricData.goalValue || 0,
            transactions: metricData.transactions || 0,
            revenue: metricData.revenue || 0,
            averageOrderValue: metricData.averageOrderValue || 0,
            deviceCategory: metricData.deviceCategory || {},
            countryData: metricData.countryData || {},
            sourceData: metricData
          });
        }
      }
      
      // Get additional breakdowns (traffic sources, devices, etc.)
      await processTrafficSourceData(site, startDate, endDate);
      await processDeviceData(site, startDate, endDate);
      await processGeographicData(site, startDate, endDate);
    }
    
    logger.info(`Completed processing performance data for business account: ${businessAccount.accountName}`);
  } catch (error) {
    logger.error(`Error processing performance data: ${error.message}`);
    throw error;
  }
}

/**
 * Process traffic source data for a site
 * @param {Object} site - GASite model instance
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 */
async function processTrafficSourceData(site, startDate, endDate) {
  logger.info(`Processing traffic source data for site: ${site.name}`);
  
  try {
    // Get traffic source breakdown from Google Analytics API
    const trafficData = await gaService.getTrafficSourceData(site.propertyId, startDate, endDate);
    
    // For each date, find and update the existing performance record
    for (const dateData of trafficData) {
      const date = dateData.date;
      
      // Find performance record for this date
      const performance = await GAPerformance.findOne({
        where: {
          date,
          GASiteId: site.id,
          filter: 'all'
        }
      });
      
      if (performance) {
        // Update with traffic source data
        await performance.update({
          trafficSource: dateData.trafficSource
        });
      }
    }
    
    logger.info(`Completed processing traffic source data for site: ${site.name}`);
  } catch (error) {
    logger.error(`Error processing traffic source data: ${error.message}`);
    throw error;
  }
}

/**
 * Process device data for a site
 * @param {Object} site - GASite model instance
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 */
async function processDeviceData(site, startDate, endDate) {
  logger.info(`Processing device data for site: ${site.name}`);
  
  try {
    // Get device breakdown from Google Analytics API
    const deviceData = await gaService.getDeviceData(site.propertyId, startDate, endDate);
    
    // For each date, find and update the existing performance record
    for (const dateData of deviceData) {
      const date = dateData.date;
      
      // Find performance record for this date
      const performance = await GAPerformance.findOne({
        where: {
          date,
          GASiteId: site.id,
          filter: 'all'
        }
      });
      
      if (performance) {
        // Update with device data
        await performance.update({
          deviceCategory: dateData.deviceCategory
        });
      }
    }
    
    logger.info(`Completed processing device data for site: ${site.name}`);
  } catch (error) {
    logger.error(`Error processing device data: ${error.message}`);
    throw error;
  }
}

/**
 * Process geographic data for a site
 * @param {Object} site - GASite model instance
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 */
async function processGeographicData(site, startDate, endDate) {
  logger.info(`Processing geographic data for site: ${site.name}`);
  
  try {
    // Get geographic breakdown from Google Analytics API
    const geoData = await gaService.getGeographicData(site.propertyId, startDate, endDate);
    
    // For each date, find and update the existing performance record
    for (const dateData of geoData) {
      const date = dateData.date;
      
      // Find performance record for this date
      const performance = await GAPerformance.findOne({
        where: {
          date,
          GASiteId: site.id,
          filter: 'all'
        }
      });
      
      if (performance) {
        // Update with geographic data
        await performance.update({
          countryData: dateData.countryData
        });
      }
    }
    
    logger.info(`Completed processing geographic data for site: ${site.name}`);
  } catch (error) {
    logger.error(`Error processing geographic data: ${error.message}`);
    throw error;
  }
}

/**
 * Process funnel data for all configured funnels
 * @param {Object} businessAccount - BusinessAccount model instance
 */
async function processFunnelData(businessAccount) {
  logger.info(`Processing funnel data for business account: ${businessAccount.accountName}`);
  
  try {
    // Get all funnels for this business account
    const funnels = await GAFunnel.findAll({
      where: {
        '$GASite.businessAccountId$': businessAccount.id,
        active: true
      },
      include: [{ model: GASite }]
    });
    
    if (funnels.length === 0) {
      logger.info(`No active funnels found for business account: ${businessAccount.accountName}`);
      return;
    }
    
    // Define date range (last 30 days by default)
    const endDate = moment().subtract(1, 'days').format('YYYY-MM-DD');
    const startDate = moment().subtract(30, 'days').format('YYYY-MM-DD');
    
    // Process each funnel
    for (const funnel of funnels) {
      // Get funnel data from Google Analytics API
      const funnelData = await gaService.getFunnelData(
        funnel.GASite.propertyId,
        funnel.steps,
        startDate,
        endDate
      );
      
      // Process each day's data
      for (const dateData of funnelData) {
        const date = dateData.date;
        
        // Find or create funnel performance record
        const [performance, created] = await GAFunnelPerformance.findOrCreate({
          where: {
            date,
            GAFunnelId: funnel.id
          },
          defaults: {
            stepData: dateData.stepData,
            conversionRate: dateData.conversionRate,
            totalEntries: dateData.totalEntries,
            totalCompletions: dateData.totalCompletions,
            avgCompletionTime: dateData.avgCompletionTime
          }
        });
        
        // Update record if it exists
        if (!created) {
          await performance.update({
            stepData: dateData.stepData,
            conversionRate: dateData.conversionRate,
            totalEntries: dateData.totalEntries,
            totalCompletions: dateData.totalCompletions,
            avgCompletionTime: dateData.avgCompletionTime
          });
        }
      }
    }
    
    logger.info(`Completed processing funnel data for client: ${client.name}`);
  } catch (error) {
    logger.error(`Error processing funnel data: ${error.message}`);
    throw error;
  }
}

module.exports = {
  processBusinessAccount,
  processSiteInfo,
  processPerformanceData,
  processFunnelData
};
