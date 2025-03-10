const { BusinessSDK } = require('facebook-nodejs-business-sdk');
const axios = require('axios');
const logger = require('../utils/logger');

// Initialize Meta Ads API client
let api = null;
let accessToken = null;
let adAccountId = null;

/**
 * Initialize Meta Ads API client with credentials
 * @param {Object} credentials - Meta credentials
 */
async function initialize(credentials) {
  try {
    // Set Meta Business SDK credentials
    accessToken = credentials.accessToken;
    adAccountId = credentials.adAccountId;
    
    // Initialize API
    api = BusinessSDK.FacebookAdsApi.init(accessToken);
    BusinessSDK.FacebookAdsApi.setDebug(process.env.NODE_ENV === 'development');
    
    logger.info('Meta Ads API client initialized successfully');
    return true;
  } catch (error) {
    logger.error(`Error initializing Meta Ads API client: ${error.message}`);
    throw error;
  }
}

/**
 * Get campaigns from Meta Ads API
 * @returns {Array} Array of campaign objects
 */
async function getCampaigns() {
  try {
    if (!api || !accessToken || !adAccountId) {
      throw new Error('Meta Ads API client not initialized');
    }
    
    // Create Ad Account instance
    const AdAccount = BusinessSDK.AdAccount;
    const account = new AdAccount(`act_${adAccountId}`);
    
    // Define fields to retrieve
    const fields = [
      'id',
      'name',
      'objective',
      'status',
      'start_time',
      'stop_time',
      'budget_remaining',
      'daily_budget',
      'lifetime_budget',
      'spend_cap'
    ];
    
    // Get campaigns
    const campaigns = await account.getCampaigns(fields);
    return campaigns.map(campaign => campaign._data);
  } catch (error) {
    logger.error(`Error getting campaigns: ${error.message}`);
    throw error;
  }
}

/**
 * Get ad sets for a campaign
 * @param {string} campaignId - Campaign ID
 * @returns {Array} Array of ad set objects
 */
async function getAdSets(campaignId) {
  try {
    if (!api || !accessToken || !adAccountId) {
      throw new Error('Meta Ads API client not initialized');
    }
    
    // Create Campaign instance
    const Campaign = BusinessSDK.Campaign;
    const campaign = new Campaign(campaignId);
    
    // Define fields to retrieve
    const fields = [
      'id',
      'name',
      'status',
      'start_time',
      'end_time',
      'daily_budget',
      'lifetime_budget',
      'bid_strategy',
      'targeting',
      'optimization_goal'
    ];
    
    // Get ad sets
    const adSets = await campaign.getAdSets(fields);
    return adSets.map(adSet => adSet._data);
  } catch (error) {
    logger.error(`Error getting ad sets for campaign ${campaignId}: ${error.message}`);
    throw error;
  }
}

/**
 * Get ads for an ad set
 * @param {string} adSetId - Ad Set ID
 * @returns {Array} Array of ad objects
 */
async function getAds(adSetId) {
  try {
    if (!api || !accessToken || !adAccountId) {
      throw new Error('Meta Ads API client not initialized');
    }
    
    // Create AdSet instance
    const AdSet = BusinessSDK.AdSet;
    const adSet = new AdSet(adSetId);
    
    // Define fields to retrieve
    const fields = [
      'id',
      'name',
      'status',
      'creative',
      'adset_id',
      'campaign_id'
    ];
    
    // Get ads
    const ads = await adSet.getAds(fields);
    return ads.map(ad => ad._data);
  } catch (error) {
    logger.error(`Error getting ads for ad set ${adSetId}: ${error.message}`);
    throw error;
  }
}

/**
 * Get ad creative details
 * @param {string} creativeId - Creative ID
 * @returns {Object} Creative object
 */
async function getAdCreative(creativeId) {
  try {
    if (!api || !accessToken) {
      throw new Error('Meta Ads API client not initialized');
    }
    
    // Create AdCreative instance
    const AdCreative = BusinessSDK.AdCreative;
    const creative = new AdCreative(creativeId);
    
    // Define fields to retrieve
    const fields = [
      'id',
      'name',
      'object_type',
      'title',
      'body',
      'image_url',
      'link_url',
      'call_to_action_type'
    ];
    
    // Get creative details
    await creative.get(fields);
    return creative._data;
  } catch (error) {
    logger.error(`Error getting creative ${creativeId}: ${error.message}`);
    throw error;
  }
}

/**
 * Get account insights from Meta Ads API
 * @param {string} accountId - Ad Account ID
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Array} Array of insight objects by date
 */
async function getAccountInsights(accountId, startDate, endDate) {
  try {
    if (!api || !accessToken) {
      throw new Error('Meta Ads API client not initialized');
    }
    
    // Create Ad Account instance
    const AdAccount = BusinessSDK.AdAccount;
    const account = new AdAccount(`act_${accountId}`);
    
    // Define fields to retrieve
    const fields = [
      'impressions',
      'reach',
      'frequency',
      'clicks',
      'ctr',
      'cpc',
      'spend',
      'actions',
      'action_values',
      'conversions',
      'cost_per_action_type',
      'video_30_sec_watched_actions',
      'outbound_clicks',
      'unique_outbound_clicks'
    ];
    
    // Define parameters
    const params = {
      'time_range': {
        'since': startDate,
        'until': endDate
      },
      'time_increment': 1, // Daily breakdown
      'level': 'account'
    };
    
    // Get insights
    const insights = await account.getInsights(fields, params);
    
    // Process insights to format we need
    return insights.map(insight => {
      const data = insight._data;
      
      // Extract conversion data if available
      let conversions = 0;
      let conversionValue = 0;
      let costPerConversion = 0;
      let roas = 0;
      
      if (data.actions) {
        // Find purchase or conversion actions
        const conversionActions = data.actions.filter(action => 
          action.action_type === 'purchase' || 
          action.action_type === 'offsite_conversion'
        );
        
        if (conversionActions.length > 0) {
          conversions = conversionActions.reduce((sum, action) => sum + parseInt(action.value || 0), 0);
        }
      }
      
      if (data.action_values) {
        // Find purchase or conversion values
        const conversionValues = data.action_values.filter(action => 
          action.action_type === 'purchase' || 
          action.action_type === 'offsite_conversion'
        );
        
        if (conversionValues.length > 0) {
          conversionValue = conversionValues.reduce((sum, action) => sum + parseFloat(action.value || 0), 0);
        }
      }
      
      if (data.cost_per_action_type) {
        // Find cost per purchase or conversion
        const costPerActions = data.cost_per_action_type.filter(action => 
          action.action_type === 'purchase' || 
          action.action_type === 'offsite_conversion'
        );
        
        if (costPerActions.length > 0) {
          costPerConversion = costPerActions[0].value;
        }
      }
      
      // Calculate ROAS if possible
      if (conversionValue > 0 && parseFloat(data.spend) > 0) {
        roas = conversionValue / parseFloat(data.spend);
      }
      
      return {
        date_start: data.date_start,
        impressions: parseInt(data.impressions || 0),
        reach: parseInt(data.reach || 0),
        frequency: parseFloat(data.frequency || 0),
        clicks: parseInt(data.clicks || 0),
        ctr: parseFloat(data.ctr || 0),
        cpc: parseFloat(data.cpc || 0),
        spend: parseFloat(data.spend || 0),
        conversions,
        cost_per_conversion: costPerConversion,
        conversion_value: conversionValue,
        roas,
        video_views: data.video_30_sec_watched_actions ? 
          parseInt(data.video_30_sec_watched_actions[0]?.value || 0) : 0,
        post_engagements: data.outbound_clicks ? 
          parseInt(data.outbound_clicks[0]?.value || 0) : 0,
        demographic_data: null, // Would need separate API call for demographic breakdown
        source_data: data
      };
    });
  } catch (error) {
    logger.error(`Error getting account insights: ${error.message}`);
    throw error;
  }
}

/**
 * Get campaign insights from Meta Ads API
 * @param {string} campaignId - Campaign ID
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Array} Array of insight objects by date
 */
async function getCampaignInsights(campaignId, startDate, endDate) {
  try {
    if (!api || !accessToken) {
      throw new Error('Meta Ads API client not initialized');
    }
    
    // Create Campaign instance
    const Campaign = BusinessSDK.Campaign;
    const campaign = new Campaign(campaignId);
    
    // Define fields to retrieve (same as account insights)
    const fields = [
      'impressions',
      'reach',
      'frequency',
      'clicks',
      'ctr',
      'cpc',
      'spend',
      'actions',
      'action_values',
      'conversions',
      'cost_per_action_type',
      'video_30_sec_watched_actions',
      'outbound_clicks',
      'unique_outbound_clicks'
    ];
    
    // Define parameters
    const params = {
      'time_range': {
        'since': startDate,
        'until': endDate
      },
      'time_increment': 1, // Daily breakdown
      'level': 'campaign'
    };
    
    // Get insights
    const insights = await campaign.getInsights(fields, params);
    
    // Process insights (same processing as account insights)
    return insights.map(insight => {
      const data = insight._data;
      
      // Extract conversion data if available
      let conversions = 0;
      let conversionValue = 0;
      let costPerConversion = 0;
      let roas = 0;
      
      if (data.actions) {
        // Find purchase or conversion actions
        const conversionActions = data.actions.filter(action => 
          action.action_type === 'purchase' || 
          action.action_type === 'offsite_conversion'
        );
        
        if (conversionActions.length > 0) {
          conversions = conversionActions.reduce((sum, action) => sum + parseInt(action.value || 0), 0);
        }
      }
      
      if (data.action_values) {
        // Find purchase or conversion values
        const conversionValues = data.action_values.filter(action => 
          action.action_type === 'purchase' || 
          action.action_type === 'offsite_conversion'
        );
        
        if (conversionValues.length > 0) {
          conversionValue = conversionValues.reduce((sum, action) => sum + parseFloat(action.value || 0), 0);
        }
      }
      
      if (data.cost_per_action_type) {
        // Find cost per purchase or conversion
        const costPerActions = data.cost_per_action_type.filter(action => 
          action.action_type === 'purchase' || 
          action.action_type === 'offsite_conversion'
        );
        
        if (costPerActions.length > 0) {
          costPerConversion = costPerActions[0].value;
        }
      }
      
      // Calculate ROAS if possible
      if (conversionValue > 0 && parseFloat(data.spend) > 0) {
        roas = conversionValue / parseFloat(data.spend);
      }
      
      return {
        date_start: data.date_start,
        impressions: parseInt(data.impressions || 0),
        reach: parseInt(data.reach || 0),
        frequency: parseFloat(data.frequency || 0),
        clicks: parseInt(data.clicks || 0),
        ctr: parseFloat(data.ctr || 0),
        cpc: parseFloat(data.cpc || 0),
        spend: parseFloat(data.spend || 0),
        conversions,
        cost_per_conversion: costPerConversion,
        conversion_value: conversionValue,
        roas,
        video_views: data.video_30_sec_watched_actions ? 
          parseInt(data.video_30_sec_watched_actions[0]?.value || 0) : 0,
        post_engagements: data.outbound_clicks ? 
          parseInt(data.outbound_clicks[0]?.value || 0) : 0,
        demographic_data: null,
        source_data: data
      };
    });
  } catch (error) {
    logger.error(`Error getting campaign insights: ${error.message}`);
    throw error;
  }
}

// Similar implementation for getAdSetInsights and getAdInsights
// For brevity, these functions are omitted but would follow the same pattern

module.exports = {
  initialize,
  getCampaigns,
  getAdSets,
  getAds,
  getAdCreative,
  getAccountInsights,
  getCampaignInsights
};
