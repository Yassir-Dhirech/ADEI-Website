import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class Club extends Model {
  declare id: number;
  declare club: string;
  declare president: string;
  declare annees_etude: string;
  declare tel: string;
  declare email: string;
  declare website: string;
  declare image: string;
  declare description: string;
  declare activities: string[];
  declare achievements: string[];
  declare members: number;
  declare facebook: string;
  declare instagram: string;
  declare linkedin: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Club.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  club: { type: DataTypes.STRING(255), allowNull: false },
  president: { type: DataTypes.STRING(255), allowNull: false },
  annees_etude: { type: DataTypes.STRING(100), allowNull: false },
  tel: { type: DataTypes.STRING(20), allowNull: false },
  email: { type: DataTypes.STRING(255), allowNull: false },
  website: { type: DataTypes.STRING(500), defaultValue: '' },
  image: { type: DataTypes.STRING(500), defaultValue: '' },
  description: { type: DataTypes.TEXT, defaultValue: '' },
  activities: { type: DataTypes.JSONB, defaultValue: [] },
  achievements: { type: DataTypes.JSONB, defaultValue: [] },
  members: { type: DataTypes.INTEGER, defaultValue: 0 },
  facebook: { type: DataTypes.STRING(500), defaultValue: '' },
  instagram: { type: DataTypes.STRING(500), defaultValue: '' },
  linkedin: { type: DataTypes.STRING(500), defaultValue: '' }
}, {
  sequelize,
  tableName: 'clubs',
  timestamps: true
});

export default Club;
