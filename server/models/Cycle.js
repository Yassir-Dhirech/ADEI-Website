const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cycle = sequelize.define('Cycle', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  order_display: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
}, { tableName: 'cycles', timestamps: true });

module.exports = Cycle;