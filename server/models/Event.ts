import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class Event extends Model {
  declare id: number;
  declare title: string;
  declare description: string;
  declare date: string;
  declare time: string;
  declare location: string;
  declare category: string;
  declare clubId: number | null;
  declare organizer: string | null;
  declare image: string | null;
  declare document: string | null;
  declare link: string | null;
  declare order_display: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Event.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  time: { type: DataTypes.STRING(50), allowNull: false },
  location: { type: DataTypes.STRING(255), allowNull: false },
  category: { type: DataTypes.STRING(100), defaultValue: '' },
  clubId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'clubs', key: 'id' } },
  organizer: { type: DataTypes.STRING(255), allowNull: true, defaultValue: 'ADEI' },
  image: { type: DataTypes.STRING(500), allowNull: true },
  document: { type: DataTypes.STRING(500), allowNull: true },
  link: { type: DataTypes.STRING(500), allowNull: true },
  order_display: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
}, {
  sequelize,
  tableName: 'events',
  timestamps: true
});

export default Event;
