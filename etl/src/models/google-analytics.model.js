const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { BusinessAccount } = require('./business-account.model');

/**
 * Modelo para armazenar dados de sites do Google Analytics
 */
const GASite = sequelize.define('GASite', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  businessAccountId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: BusinessAccount,
      key: 'id'
    }
  },
  propertyId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  siteUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  siteName: {
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
 * Modelo para armazenar dados de performance do Google Analytics
 */
const GAPerformance = sequelize.define('GAPerformance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  siteId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: GASite,
      key: 'id'
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
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
  pageviews: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  bounceRate: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0
  },
  avgSessionDuration: {
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

/**
 * Modelo para armazenar configurações de funis no Google Analytics
 */
const GAFunnel = sequelize.define('GAFunnel', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  siteId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: GASite,
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  steps: {
    type: DataTypes.JSON,
    allowNull: false
  },
  metaData: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  timestamps: true
});

/**
 * Modelo para armazenar dados de performance de funis
 */
const GAFunnelPerformance = sequelize.define('GAFunnelPerformance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  funnelId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: GAFunnel,
      key: 'id'
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  stepData: {
    type: DataTypes.JSON,
    allowNull: false
  },
  conversionRate: {
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
BusinessAccount.hasMany(GASite, { foreignKey: 'businessAccountId' });
GASite.belongsTo(BusinessAccount, { foreignKey: 'businessAccountId' });

GASite.hasMany(GAPerformance, { foreignKey: 'siteId' });
GAPerformance.belongsTo(GASite, { foreignKey: 'siteId' });

GASite.hasMany(GAFunnel, { foreignKey: 'siteId' });
GAFunnel.belongsTo(GASite, { foreignKey: 'siteId' });

GAFunnel.hasMany(GAFunnelPerformance, { foreignKey: 'funnelId' });
GAFunnelPerformance.belongsTo(GAFunnel, { foreignKey: 'funnelId' });

module.exports = {
  GASite,
  GAPerformance,
  GAFunnel,
  GAFunnelPerformance
};
