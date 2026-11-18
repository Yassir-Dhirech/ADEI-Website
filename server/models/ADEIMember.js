const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ADEIMember = sequelize.define('ADEIMember', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM(
      'President',
      'Vice President',
      'Secrétaire Générale',
      'Trésorier',
      'Conseillers',
      'IT Manager',
      'IT Team',
      'Représentant des étudiants étrangers',
      'Représentant des Lauréats',
      'Affaires Administratives',
      'Responsable Media',
      'Responsable Interne',
      'Responsables Sponsoring',
      'Responsables Création & Design'
    ),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  photo: {
    type: DataTypes.STRING(500),
    defaultValue: '/images/default.jpg'
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references:{
      model: 'adei_roles',
      key: 'id' }
    }
}, {
  tableName: 'adei_members',
  timestamps: true
});

module.exports = ADEIMember;
