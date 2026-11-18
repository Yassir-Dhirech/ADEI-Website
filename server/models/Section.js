const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Section = sequelize.define('Section', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  academicYearId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'academic_years', key: 'id' } },
  name: { type: DataTypes.STRING(50), allowNull: false },
  delegateName: { type: DataTypes.STRING(255), allowNull: true },
  delegatePhone: { type: DataTypes.STRING(20), allowNull: true }
}, { tableName: 'sections', timestamps: true });

module.exports = Section;