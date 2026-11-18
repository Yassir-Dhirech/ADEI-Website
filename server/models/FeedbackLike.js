const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FeedbackLike = sequelize.define('FeedbackLike', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  feedbackId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'feedbacks', key: 'id' } },
  userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } }
}, {
  tableName: 'feedback_likes',
  timestamps: true,
  indexes: [{ unique: true, fields: ['feedbackId', 'userId'] }]
});

module.exports = FeedbackLike;