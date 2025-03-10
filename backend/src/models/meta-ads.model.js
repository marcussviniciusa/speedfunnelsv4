const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { Client } = require('./client.model');

// Campaign data from Meta Ads
const MetaCampaign = sequelize.define('MetaCampaign', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  campaignId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  objective: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  budget: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  budgetRemaining: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  spendCap: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  sourceData: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  timestamps: true
});

// Ad Set data from Meta Ads
const MetaAdSet = sequelize.define('MetaAdSet', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  adSetId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  budget: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  bidStrategy: {
    type: DataTypes.STRING,
    allowNull: true
  },
  targetingSpec: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  optimization: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sourceData: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  timestamps: true
});

// Ad data from Meta Ads
const MetaAd = sequelize.define('MetaAd', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  adId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true
  },
  creativeType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  headline: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  linkUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sourceData: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  timestamps: true
});

// Performance metrics for Meta Ads
const MetaPerformance = sequelize.define('MetaPerformance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  level: {
    type: DataTypes.ENUM('account', 'campaign', 'adset', 'ad'),
    allowNull: false
  },
  entityId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Core metrics
  impressions: {
    type: DataTypes.BIGINT,
    allowNull: true,
    defaultValue: 0
  },
  reach: {
    type: DataTypes.BIGINT,
    allowNull: true,
    defaultValue: 0
  },
  frequency: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0
  },
  clicks: {
    type: DataTypes.BIGINT,
    allowNull: true,
    defaultValue: 0
  },
  ctr: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: true,
    defaultValue: 0
  },
  cpc: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: true,
    defaultValue: 0
  },
  spend: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0
  },
  // Conversion metrics
  conversions: {
    type: DataTypes.BIGINT,
    allowNull: true,
    defaultValue: 0
  },
  costPerConversion: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0
  },
  conversionValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0
  },
  roas: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: true,
    defaultValue: 0
  },
  // Engagement metrics
  videoViews: {
    type: DataTypes.BIGINT,
    allowNull: true,
    defaultValue: 0
  },
  postEngagements: {
    type: DataTypes.BIGINT,
    allowNull: true,
    defaultValue: 0
  },
  // Demographic breakdown (summary)
  demographicData: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  // Raw data from API
  sourceData: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['date', 'level', 'entityId'],
      unique: true
    },
    {
      fields: ['entityId']
    }
  ]
});

// Define relationships
Client.hasMany(MetaCampaign);
MetaCampaign.belongsTo(Client);

MetaCampaign.hasMany(MetaAdSet);
MetaAdSet.belongsTo(MetaCampaign);

MetaAdSet.hasMany(MetaAd);
MetaAd.belongsTo(MetaAdSet);

Client.hasMany(MetaPerformance);
MetaPerformance.belongsTo(Client);

module.exports = {
  MetaCampaign,
  MetaAdSet,
  MetaAd,
  MetaPerformance
};
