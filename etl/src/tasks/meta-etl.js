const moment = require('moment');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');
const metaService = require('../services/meta-service');

// Load models
const { BusinessAccount } = require('../models/business-account.model');
const { 
  MetaCampaign, 
  MetaAdSet, 
  MetaAd, 
  MetaPerformance 
} = require('../models/meta-ads.model');

/**
 * Process Meta Ads data for a specific business account
 * @param {Object} businessAccount - BusinessAccount model instance
 */
async function processBusinessAccount(businessAccount) {
  logger.info(`Starting Meta Ads ETL for business account: ${businessAccount.accountName}`);
  const accessToken = businessAccount.accessToken;
  
  if (!accessToken) {
    logger.error(`No valid Meta access token for business account: ${businessAccount.accountName}`);
    return;
  }
  
  try {
    // Initialize Meta service with client credentials
    await metaService.initialize(metaCredential);
    
    // Extract and process campaigns
    await processCampaigns(client);
    
    // Extract and process performance data
    await processPerformanceData(client);
    
    logger.info(`Completed Meta Ads ETL for client: ${client.name}`);
  } catch (error) {
    logger.error(`Error in Meta Ads ETL for client ${client.name}: ${error.message}`);
    throw error;
  }
}

/**
 * Process campaign data for a client
 * @param {Object} client - Client model instance
 */
async function processCampaigns(client) {
  logger.info(`Processing campaigns for client: ${client.name}`);
  
  try {
    // Get campaigns from Meta Ads API
    const campaigns = await metaService.getCampaigns();
    logger.info(`Retrieved ${campaigns.length} campaigns from Meta Ads API`);
    
    // Process each campaign
    for (const campaignData of campaigns) {
      // Find or create campaign record
      const [campaign, campaignCreated] = await MetaCampaign.findOrCreate({
        where: { 
          campaignId: campaignData.id,
          ClientId: client.id
        },
        defaults: {
          name: campaignData.name,
          objective: campaignData.objective,
          status: campaignData.status,
          startDate: campaignData.start_time ? new Date(campaignData.start_time) : null,
          endDate: campaignData.stop_time ? new Date(campaignData.stop_time) : null,
          budget: campaignData.budget_remaining,
          sourceData: campaignData
        }
      });
      
      // Update campaign if it exists
      if (!campaignCreated) {
        await campaign.update({
          name: campaignData.name,
          objective: campaignData.objective,
          status: campaignData.status,
          startDate: campaignData.start_time ? new Date(campaignData.start_time) : null,
          endDate: campaignData.stop_time ? new Date(campaignData.stop_time) : null,
          budget: campaignData.budget_remaining,
          sourceData: campaignData
        });
      }
      
      // Process ad sets for this campaign
      await processAdSets(client, campaign, campaignData.id);
    }
    
    logger.info(`Completed processing campaigns for client: ${client.name}`);
  } catch (error) {
    logger.error(`Error processing campaigns: ${error.message}`);
    throw error;
  }
}

/**
 * Process ad sets for a campaign
 * @param {Object} client - Client model instance
 * @param {Object} campaign - Campaign model instance
 * @param {string} campaignId - Campaign ID from Meta Ads
 */
async function processAdSets(client, campaign, campaignId) {
  logger.info(`Processing ad sets for campaign: ${campaign.name}`);
  
  try {
    // Get ad sets from Meta Ads API
    const adSets = await metaService.getAdSets(campaignId);
    logger.info(`Retrieved ${adSets.length} ad sets for campaign ${campaign.name}`);
    
    // Process each ad set
    for (const adSetData of adSets) {
      // Find or create ad set record
      const [adSet, adSetCreated] = await MetaAdSet.findOrCreate({
        where: { 
          adSetId: adSetData.id,
          MetaCampaignId: campaign.id
        },
        defaults: {
          name: adSetData.name,
          status: adSetData.status,
          startDate: adSetData.start_time ? new Date(adSetData.start_time) : null,
          endDate: adSetData.end_time ? new Date(adSetData.end_time) : null,
          budget: adSetData.daily_budget || adSetData.lifetime_budget,
          bidStrategy: adSetData.bid_strategy,
          targetingSpec: adSetData.targeting,
          optimization: adSetData.optimization_goal,
          sourceData: adSetData
        }
      });
      
      // Update ad set if it exists
      if (!adSetCreated) {
        await adSet.update({
          name: adSetData.name,
          status: adSetData.status,
          startDate: adSetData.start_time ? new Date(adSetData.start_time) : null,
          endDate: adSetData.end_time ? new Date(adSetData.end_time) : null,
          budget: adSetData.daily_budget || adSetData.lifetime_budget,
          bidStrategy: adSetData.bid_strategy,
          targetingSpec: adSetData.targeting,
          optimization: adSetData.optimization_goal,
          sourceData: adSetData
        });
      }
      
      // Process ads for this ad set
      await processAds(client, adSet, adSetData.id);
    }
    
    logger.info(`Completed processing ad sets for campaign: ${campaign.name}`);
  } catch (error) {
    logger.error(`Error processing ad sets: ${error.message}`);
    throw error;
  }
}

/**
 * Process ads for an ad set
 * @param {Object} client - Client model instance
 * @param {Object} adSet - Ad Set model instance
 * @param {string} adSetId - Ad Set ID from Meta Ads
 */
async function processAds(client, adSet, adSetId) {
  logger.info(`Processing ads for ad set: ${adSet.name}`);
  
  try {
    // Get ads from Meta Ads API
    const ads = await metaService.getAds(adSetId);
    logger.info(`Retrieved ${ads.length} ads for ad set ${adSet.name}`);
    
    // Process each ad
    for (const adData of ads) {
      // Get creative data
      const creative = await metaService.getAdCreative(adData.creative.id);
      
      // Find or create ad record
      const [ad, adCreated] = await MetaAd.findOrCreate({
        where: { 
          adId: adData.id,
          MetaAdSetId: adSet.id
        },
        defaults: {
          name: adData.name,
          status: adData.status,
          creativeType: creative?.object_type || 'unknown',
          headline: creative?.title || creative?.body || '',
          body: creative?.body || '',
          imageUrl: creative?.image_url || '',
          linkUrl: creative?.link_url || '',
          sourceData: { ad: adData, creative }
        }
      });
      
      // Update ad if it exists
      if (!adCreated) {
        await ad.update({
          name: adData.name,
          status: adData.status,
          creativeType: creative?.object_type || 'unknown',
          headline: creative?.title || creative?.body || '',
          body: creative?.body || '',
          imageUrl: creative?.image_url || '',
          linkUrl: creative?.link_url || '',
          sourceData: { ad: adData, creative }
        });
      }
    }
    
    logger.info(`Completed processing ads for ad set: ${adSet.name}`);
  } catch (error) {
    logger.error(`Error processing ads: ${error.message}`);
    throw error;
  }
}

/**
 * Process performance data for all entities
 * @param {Object} client - Client model instance
 */
async function processPerformanceData(client) {
  logger.info(`Processing performance data for client: ${client.name}`);
  
  try {
    // Define date range (last 30 days by default)
    const endDate = moment().subtract(1, 'days').format('YYYY-MM-DD');
    const startDate = moment().subtract(30, 'days').format('YYYY-MM-DD');
    
    // Process account level metrics
    await processAccountMetrics(client, startDate, endDate);
    
    // Process campaign level metrics
    await processCampaignMetrics(client, startDate, endDate);
    
    // Process ad set level metrics
    await processAdSetMetrics(client, startDate, endDate);
    
    // Process ad level metrics
    await processAdMetrics(client, startDate, endDate);
    
    logger.info(`Completed processing performance data for client: ${client.name}`);
  } catch (error) {
    logger.error(`Error processing performance data: ${error.message}`);
    throw error;
  }
}

/**
 * Process account level metrics
 * @param {Object} client - Client model instance
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 */
async function processAccountMetrics(client, startDate, endDate) {
  logger.info(`Processing account metrics for client: ${client.name}`);
  
  try {
    // Get account ID from credentials
    const accountId = client.MetaCredential.adAccountId;
    if (!accountId) {
      logger.error(`No ad account ID for client: ${client.name}`);
      return;
    }
    
    // Get account insights from Meta Ads API
    const insights = await metaService.getAccountInsights(accountId, startDate, endDate);
    logger.info(`Retrieved ${insights.length} days of account insights`);
    
    // Process each day's data
    for (const insight of insights) {
      const date = insight.date_start;
      
      // Find or create performance record
      const [performance, created] = await MetaPerformance.findOrCreate({
        where: {
          date,
          level: 'account',
          entityId: accountId,
          ClientId: client.id
        },
        defaults: {
          impressions: insight.impressions || 0,
          reach: insight.reach || 0,
          frequency: insight.frequency || 0,
          clicks: insight.clicks || 0,
          ctr: insight.ctr || 0,
          cpc: insight.cpc || 0,
          spend: insight.spend || 0,
          conversions: insight.conversions || 0,
          costPerConversion: insight.cost_per_conversion || 0,
          conversionValue: insight.conversion_value || 0,
          roas: insight.roas || 0,
          videoViews: insight.video_views || 0,
          postEngagements: insight.post_engagements || 0,
          demographicData: insight.demographic_data || null,
          sourceData: insight
        }
      });
      
      // Update record if it exists
      if (!created) {
        await performance.update({
          impressions: insight.impressions || 0,
          reach: insight.reach || 0,
          frequency: insight.frequency || 0,
          clicks: insight.clicks || 0,
          ctr: insight.ctr || 0,
          cpc: insight.cpc || 0,
          spend: insight.spend || 0,
          conversions: insight.conversions || 0,
          costPerConversion: insight.cost_per_conversion || 0,
          conversionValue: insight.conversion_value || 0,
          roas: insight.roas || 0,
          videoViews: insight.video_views || 0,
          postEngagements: insight.post_engagements || 0,
          demographicData: insight.demographic_data || null,
          sourceData: insight
        });
      }
    }
    
    logger.info(`Completed processing account metrics for client: ${client.name}`);
  } catch (error) {
    logger.error(`Error processing account metrics: ${error.message}`);
    throw error;
  }
}

/**
 * Process campaign level metrics
 * @param {Object} client - Client model instance
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 */
async function processCampaignMetrics(client, startDate, endDate) {
  logger.info(`Processing campaign metrics for client: ${client.name}`);
  
  try {
    // Get all campaigns for this client
    const campaigns = await MetaCampaign.findAll({
      where: { ClientId: client.id }
    });
    
    // Process each campaign
    for (const campaign of campaigns) {
      // Get campaign insights from Meta Ads API
      const insights = await metaService.getCampaignInsights(campaign.campaignId, startDate, endDate);
      logger.info(`Retrieved ${insights.length} days of insights for campaign ${campaign.name}`);
      
      // Process each day's data
      for (const insight of insights) {
        const date = insight.date_start;
        
        // Find or create performance record
        const [performance, created] = await MetaPerformance.findOrCreate({
          where: {
            date,
            level: 'campaign',
            entityId: campaign.campaignId,
            ClientId: client.id
          },
          defaults: {
            impressions: insight.impressions || 0,
            reach: insight.reach || 0,
            frequency: insight.frequency || 0,
            clicks: insight.clicks || 0,
            ctr: insight.ctr || 0,
            cpc: insight.cpc || 0,
            spend: insight.spend || 0,
            conversions: insight.conversions || 0,
            costPerConversion: insight.cost_per_conversion || 0,
            conversionValue: insight.conversion_value || 0,
            roas: insight.roas || 0,
            videoViews: insight.video_views || 0,
            postEngagements: insight.post_engagements || 0,
            demographicData: insight.demographic_data || null,
            sourceData: insight
          }
        });
        
        // Update record if it exists
        if (!created) {
          await performance.update({
            impressions: insight.impressions || 0,
            reach: insight.reach || 0,
            frequency: insight.frequency || 0,
            clicks: insight.clicks || 0,
            ctr: insight.ctr || 0,
            cpc: insight.cpc || 0,
            spend: insight.spend || 0,
            conversions: insight.conversions || 0,
            costPerConversion: insight.cost_per_conversion || 0,
            conversionValue: insight.conversion_value || 0,
            roas: insight.roas || 0,
            videoViews: insight.video_views || 0,
            postEngagements: insight.post_engagements || 0,
            demographicData: insight.demographic_data || null,
            sourceData: insight
          });
        }
      }
    }
    
    logger.info(`Completed processing campaign metrics for client: ${client.name}`);
  } catch (error) {
    logger.error(`Error processing campaign metrics: ${error.message}`);
    throw error;
  }
}

// Similar implementation for processAdSetMetrics and processAdMetrics
// For brevity, these functions are omitted but would follow the same pattern

// Simplified versions for completeness
async function processAdSetMetrics(client, startDate, endDate) {
  logger.info(`Processing ad set metrics for client: ${client.name}`);
  // Implementation similar to processCampaignMetrics but for ad sets
}

async function processAdMetrics(client, startDate, endDate) {
  logger.info(`Processing ad metrics for client: ${client.name}`);
  // Implementation similar to processCampaignMetrics but for ads
}

module.exports = {
  processBusinessAccount,
  processCampaigns,
  processPerformanceData
};
