import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class Feedback extends Model {
  declare id: number;
  declare name: string;
  declare email: string;
  declare type: 'avis' | 'recommandation' | 'autre';
  declare message: string;
  declare read: boolean;
  declare isPublished: boolean;
  declare userId: number | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Feedback.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  email: { type: DataTypes.STRING(255), allowNull: false },
  type: { type: DataTypes.ENUM('avis', 'recommandation', 'autre'), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  read: { type: DataTypes.BOOLEAN, defaultValue: false },
  isPublished: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false, field: 'ispublished' },
  userId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } }
}, {
  sequelize,
  tableName: 'feedbacks',
  timestamps: true
});

export default Feedback;
