import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class Section extends Model {
  declare id: number;
  declare academicYearId: number;
  declare name: string;
  declare delegateName: string | null;
  declare delegatePhone: string | null;
}

Section.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  academicYearId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'academic_years', key: 'id' } },
  name: { type: DataTypes.STRING(50), allowNull: false },
  delegateName: { type: DataTypes.STRING(255), allowNull: true },
  delegatePhone: { type: DataTypes.STRING(20), allowNull: true }
}, {
  sequelize,
  tableName: 'sections',
  timestamps: true
});

export default Section;
