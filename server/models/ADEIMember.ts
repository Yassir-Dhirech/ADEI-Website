import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class ADEIMember extends Model {
  declare id: number;
  declare name: string;
  declare role: string;
  declare roleId: number | null;
  declare mandate: string;
  declare email: string;
  declare photo: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ADEIMember.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  role: {
    type: DataTypes.ENUM(
      'President', 'Vice President', 'Secrétaire Générale', 'Trésorier', 'Conseillers',
      'IT Manager', 'IT Team', 'Représentant des étudiants étrangers', 'Représentant des Lauréats',
      'Affaires Administratives', 'Responsable Media', 'Responsable Interne',
      'Responsables Sponsoring', 'Responsables Création & Design'
    ),
    allowNull: false
  },
  roleId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'adei_roles', key: 'id' } },
  mandate: { type: DataTypes.STRING(20), allowNull: false, defaultValue: '2025/2026' },
  email: { type: DataTypes.STRING(255), allowNull: false },
  photo: { type: DataTypes.STRING(500), defaultValue: '/images/default.jpg' }
}, {
  sequelize,
  tableName: 'adei_members',
  timestamps: true
});

export default ADEIMember;
