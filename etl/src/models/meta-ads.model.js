const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Modelo para armazenar dados de campanhas do Meta Ads
 */
const MetaCampaign = sequelize.define('MetaCampaign', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  businessAccountId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  campaignId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false
  },
  objective: {
    type: DataTypes.STRING,
    allowNull: true
  },
  metaData: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  timestamps: true
});

/**
 * Modelo para armazenar dados de conjuntos de anúncios do Meta Ads
 */
const MetaAdSet = sequelize.define('MetaAdSet', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  campaignId: {
    type: DataTypes.UUID,
    allowNull: false
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
    allowNull: false
  },
  targetingSpecs: {
    type: DataTypes.JSON,
    allowNull: true
  },
  metaData: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  timestamps: true
});

/**
 * Modelo para armazenar dados de anúncios do Meta Ads
 */
const MetaAd = sequelize.define('MetaAd', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  adSetId: {
    type: DataTypes.UUID,
    allowNull: false
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
    allowNull: false
  },
  creativeId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  metaData: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  timestamps: true
});

/**
 * Modelo para armazenar dados de performance do Meta Ads
 */
const MetaPerformance = sequelize.define('MetaPerformance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  businessAccountId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  campaignId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  adSetId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  adId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  spend: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0
  },
  impressions: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  clicks: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  ctr: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0
  },
  cpc: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0
  },
  conversions: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  costPerConversion: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0
  },
  metaData: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  timestamps: true
});

// Define relationships
MetaCampaign.hasMany(MetaAdSet, { foreignKey: 'campaignId' });
MetaAdSet.belongsTo(MetaCampaign, { foreignKey: 'campaignId' });

MetaAdSet.hasMany(MetaAd, { foreignKey: 'adSetId' });
MetaAd.belongsTo(MetaAdSet, { foreignKey: 'adSetId' });

MetaCampaign.hasMany(MetaPerformance, { foreignKey: 'campaignId' });
MetaPerformance.belongsTo(MetaCampaign, { foreignKey: 'campaignId' });

MetaAdSet.hasMany(MetaPerformance, { foreignKey: 'adSetId' });
MetaPerformance.belongsTo(MetaAdSet, { foreignKey: 'adSetId' });

MetaAd.hasMany(MetaPerformance, { foreignKey: 'adId' });
MetaPerformance.belongsTo(MetaAd, { foreignKey: 'adId' });

module.exports = {
  MetaCampaign,
  MetaAdSet,
  MetaAd,
  MetaPerformance
};
