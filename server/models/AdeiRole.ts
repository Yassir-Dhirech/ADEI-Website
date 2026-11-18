import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class AdeiRole extends Model {
  declare id: number;
  declare name: string;
  declare tier: number;
  declare position: number;
}

AdeiRole.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  tier: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 3 },
  position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
}, {
  sequelize,
  tableName: 'adei_roles',
  timestamps: true
});

export default AdeiRole;
