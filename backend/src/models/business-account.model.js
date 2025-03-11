const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user.model');

/**
 * Modelo para armazenar contas de negócios de plataformas externas (Meta, Google, etc.)
 */
const BusinessAccount = sequelize.define('BusinessAccount', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  provider: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Provedor da conta (meta, google, etc.)'
  },
  businessId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'ID do negócio na plataforma externa'
  },
  businessName: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Nome do negócio'
  },
  accessToken: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Token de acesso para a API'
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Token de atualização (quando aplicável)'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Data de expiração do token'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: 'Informações adicionais como contas de anúncios disponíveis'
  },
  lastSynced: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Última vez que os dados foram sincronizados'
  }
}, {
  tableName: 'business_accounts',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'provider', 'businessId']
    }
  ]
});

// Associação com o modelo de usuário
BusinessAccount.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(BusinessAccount, { foreignKey: 'userId', as: 'businessAccounts' });

module.exports = BusinessAccount;
