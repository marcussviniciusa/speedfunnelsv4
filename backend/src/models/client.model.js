const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { User } = require('./user.model');

// Client model definition
const Client = sequelize.define('Client', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  logo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true
});

// Integration credentials models for Meta Ads
const MetaCredential = sequelize.define('MetaCredential', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  accessToken: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tokenExpiry: {
    type: DataTypes.DATE,
    allowNull: true
  },
  adAccountId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  businessId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true
});

// Integration credentials model for Google Analytics
const GoogleAnalyticsCredential = sequelize.define('GoogleAnalyticsCredential', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  propertyId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  viewId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  accessToken: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tokenExpiry: {
    type: DataTypes.DATE,
    allowNull: true
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true
});

// Define associations
Client.hasMany(User);
User.belongsTo(Client);

Client.hasOne(MetaCredential);
MetaCredential.belongsTo(Client);

Client.hasOne(GoogleAnalyticsCredential);
GoogleAnalyticsCredential.belongsTo(Client);

module.exports = { 
  Client, 
  MetaCredential, 
  GoogleAnalyticsCredential 
};
