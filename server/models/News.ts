import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class News extends Model {
  declare id: number;
  declare title: string;
  declare content: string;
  declare date: string;
  declare clubId: number | null;
  declare organizer: string | null;
  declare image: string | null;
  declare document: string | null;
  declare link: string | null;
  declare category: string | null;
  declare order_display: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

News.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(255), allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  clubId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'clubs', key: 'id' } },
  organizer: { type: DataTypes.STRING(255), allowNull: true, defaultValue: 'ADEI' },
  image: { type: DataTypes.STRING(500), allowNull: true },
  document: { type: DataTypes.STRING(500), allowNull: true },
  link: { type: DataTypes.STRING(500), allowNull: true },
  category: { type: DataTypes.STRING(100), allowNull: true, defaultValue: 'autre' },
  order_display: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 }
}, {
  sequelize,
  tableName: 'news',
  timestamps: true
});

export default News;
