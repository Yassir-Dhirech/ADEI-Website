const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AdeiRole = sequelize.define('AdeiRole', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  tier: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 3 },
  position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
}, { tableName: 'adei_roles', timestamps: true });

module.exports = AdeiRole;