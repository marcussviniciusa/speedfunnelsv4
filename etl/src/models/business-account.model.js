const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Modelo simplificado para business accounts no ETL
 * Baseado no modelo business-account.model.js do backend
 */
const BusinessAccount = sequelize.define('BusinessAccount', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  provider: {
    type: DataTypes.STRING,
    allowNull: false
  },
  accountId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  accountName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  accessToken: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tokenExpiry: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isConnected: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  accountData: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  timestamps: true
});

// Relações com outros modelos podem ser definidas aqui
// Por exemplo, para o Meta Ads:
const { MetaCampaign } = require('./meta-ads.model');
BusinessAccount.hasMany(MetaCampaign, { foreignKey: 'businessAccountId' });
MetaCampaign.belongsTo(BusinessAccount, { foreignKey: 'businessAccountId' });

module.exports = { BusinessAccount };
