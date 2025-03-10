const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { Client } = require('./client.model');

// Google Analytics Site data model
const GASite = sequelize.define('GASite', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  propertyId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  timezone: {
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

// Google Analytics performance metrics
const GAPerformance = sequelize.define('GAPerformance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  // Traffic metrics
  sessions: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  users: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  newUsers: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  pageviews: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  // Engagement metrics
  avgSessionDuration: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0
  },
  bounceRate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0
  },
  pagesPerSession: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0
  },
  // Acquisition breakdown
  trafficSource: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  // Conversion metrics
  goalCompletions: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  goalConversionRate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0
  },
  goalValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0
  },
  // E-commerce metrics (if applicable)
  transactions: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  revenue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0
  },
  averageOrderValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0
  },
  // Device breakdown
  deviceCategory: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  // Geographic data
  countryData: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  // Raw data from API
  sourceData: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  // Filter to segment data
  filter: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['date', 'GASiteId', 'filter'],
      unique: true
    }
  ]
});

// Funnel analysis model
const GAFunnel = sequelize.define('GAFunnel', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  steps: {
    type: DataTypes.JSONB,
    allowNull: false
  }
}, {
  timestamps: true
});

// Funnel performance data
const GAFunnelPerformance = sequelize.define('GAFunnelPerformance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  // Step-by-step data
  stepData: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  // Overall conversion rate
  conversionRate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  // Total entries at first step
  totalEntries: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  // Total completions at last step
  totalCompletions: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  // Average time to complete funnel
  avgCompletionTime: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['date', 'GAFunnelId'],
      unique: true
    }
  ]
});

// Define relationships
Client.hasMany(GASite);
GASite.belongsTo(Client);

GASite.hasMany(GAPerformance);
GAPerformance.belongsTo(GASite);

Client.hasMany(GAFunnel);
GAFunnel.belongsTo(Client);

GASite.hasMany(GAFunnel);
GAFunnel.belongsTo(GASite);

GAFunnel.hasMany(GAFunnelPerformance);
GAFunnelPerformance.belongsTo(GAFunnel);

module.exports = {
  GASite,
  GAPerformance,
  GAFunnel,
  GAFunnelPerformance
};
