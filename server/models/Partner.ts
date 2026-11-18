import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class Partner extends Model {
  declare id: number;
  declare name: string;
  declare description: string | null;
  declare website: string | null;
  declare logo: string | null;
  declare facebook: string | null;
  declare instagram: string | null;
  declare whatsapp: string | null;
  declare isActive: boolean;
  declare order_display: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Partner.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  website: { type: DataTypes.STRING(500), allowNull: true, validate: { isUrl: true } },
  logo: { type: DataTypes.STRING(500), allowNull: true, defaultValue: '/images/default.jpg' },
  facebook: { type: DataTypes.STRING(500), allowNull: true, validate: { isUrl: true } },
  instagram: { type: DataTypes.STRING(500), allowNull: true, validate: { isUrl: true } },
  whatsapp: { type: DataTypes.STRING(500), allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  order_display: { type: DataTypes.INTEGER, defaultValue: 0 }
}, {
  sequelize,
  tableName: 'partners',
  timestamps: true
});

export default Partner;
