import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class FeedbackLike extends Model {
  declare id: number;
  declare feedbackId: number;
  declare userId: number;
}

FeedbackLike.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  feedbackId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'feedbacks', key: 'id' } },
  userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } }
}, {
  sequelize,
  tableName: 'feedback_likes',
  timestamps: true,
  indexes: [{ unique: true, fields: ['feedbackId', 'userId'] }]
});

export default FeedbackLike;
