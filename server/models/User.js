const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: {
        args: [8, 255],
        msg: 'Le mot de passe doit contenir au moins 8 caractères'
      }
    }
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user'
  },
  // Badge fields
  is_president: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_representant: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_membre_adei: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_bureau_adei: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lastPasswordChange: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  }
}, {
  tableName: 'users',
  timestamps: true
});

module.exports = User;
