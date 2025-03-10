const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// User model definition
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true 
  },
  role: {
    type: DataTypes.ENUM('admin', 'manager', 'client'),
    defaultValue: 'client'
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLogin: {
    type: DataTypes.DATE
  },
  googleId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  googleAccessToken: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  googleRefreshToken: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  googleTokenExpiry: {
    type: DataTypes.DATE,
    allowNull: true
  },
  googleConnected: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = User;
