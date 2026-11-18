import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class AcademicYear extends Model {
  declare id: number;
  declare cycleId: number;
  declare filiereId: number | null;
  declare name: string;
  declare yearNumber: number;
  declare delegateName: string | null;
  declare delegatePhone: string | null;
  declare drive: string | null;
  declare documentation: string | null;
  declare order_display: number;
}

AcademicYear.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  cycleId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'cycles', key: 'id' } },
  filiereId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'filieres', key: 'id' } },
  name: { type: DataTypes.STRING(100), allowNull: false },
  yearNumber: { type: DataTypes.INTEGER, allowNull: false },
  delegateName: { type: DataTypes.STRING(255), allowNull: true },
  delegatePhone: { type: DataTypes.STRING(20), allowNull: true },
  drive: { type: DataTypes.STRING(1000), allowNull: true },
  documentation: { type: DataTypes.STRING(1000), allowNull: true },
  order_display: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
}, {
  sequelize,
  tableName: 'academic_years',
  timestamps: true
});

export default AcademicYear;
