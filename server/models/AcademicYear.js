const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AcademicYear = sequelize.define('AcademicYear', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  cycleId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'cycles', key: 'id' } },
  filiereId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'filieres', key: 'id' } },
  name: { type: DataTypes.STRING(100), allowNull: false },
  yearNumber: { type: DataTypes.INTEGER, allowNull: false },
  delegateName: { type: DataTypes.STRING(255), allowNull: true },
  delegatePhone: { type: DataTypes.STRING(20), allowNull: true },
  drive: { type: DataTypes.STRING(1000), allowNull: true },
  documentation: { type: DataTypes.STRING(1000), allowNull: true },
  order_display: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
}, { tableName: 'academic_years', timestamps: true });

module.exports = AcademicYear;