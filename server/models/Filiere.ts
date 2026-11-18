import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class Filiere extends Model {
  declare id: number;
  declare name: string;
  declare abbreviation: string;
  declare type: 'filiere' | 'prepa';
  declare documentation: string | null;
  declare drive: string | null;
  declare description: string | null;
  declare isActive: boolean;
  declare order_display: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Filiere.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(500), allowNull: false },
  abbreviation: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  type: { type: DataTypes.ENUM('filiere', 'prepa'), allowNull: false, defaultValue: 'filiere' },
  documentation: { type: DataTypes.STRING(1000), allowNull: true },
  drive: { type: DataTypes.STRING(1000), allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  order_display: { type: DataTypes.INTEGER, defaultValue: 0 },
  responsable_pedagogique: { type: DataTypes.STRING(255), allowNull: true },
  responsable_contact: { type: DataTypes.STRING(255), allowNull: true },
  delegue_cp1_a: { type: DataTypes.STRING(255), allowNull: true },
  tel_delegue_cp1_a: { type: DataTypes.STRING(20), allowNull: true },
  delegue_cp1_b: { type: DataTypes.STRING(255), allowNull: true },
  tel_delegue_cp1_b: { type: DataTypes.STRING(20), allowNull: true },
  delegue_cp1_c: { type: DataTypes.STRING(255), allowNull: true },
  tel_delegue_cp1_c: { type: DataTypes.STRING(20), allowNull: true },
  delegue_cp2_a: { type: DataTypes.STRING(255), allowNull: true },
  tel_delegue_cp2_a: { type: DataTypes.STRING(20), allowNull: true },
  delegue_cp2_b: { type: DataTypes.STRING(255), allowNull: true },
  tel_delegue_cp2_b: { type: DataTypes.STRING(20), allowNull: true },
  delegue_cp2_c: { type: DataTypes.STRING(255), allowNull: true },
  tel_delegue_cp2_c: { type: DataTypes.STRING(20), allowNull: true },
  delegue_annee1: { type: DataTypes.STRING(255), allowNull: true },
  tel_delegue_annee1: { type: DataTypes.STRING(20), allowNull: true },
  delegue_annee2: { type: DataTypes.STRING(255), allowNull: true },
  tel_delegue_annee2: { type: DataTypes.STRING(20), allowNull: true },
  delegue_annee3: { type: DataTypes.STRING(255), allowNull: true },
  tel_delegue_annee3: { type: DataTypes.STRING(20), allowNull: true }
}, {
  sequelize,
  tableName: 'filieres',
  timestamps: true,
  indexes: [
    { fields: ['abbreviation'] },
    { fields: ['type'] },
    { fields: ['isActive'] },
    { fields: ['order_display'] }
  ]
});

export default Filiere;
