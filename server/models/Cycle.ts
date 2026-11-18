import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class Cycle extends Model {
  declare id: number;
  declare code: string;
  declare name: string;
  declare order_display: number;
}

Cycle.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  order_display: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
}, {
  sequelize,
  tableName: 'cycles',
  timestamps: true
});

export default Cycle;
