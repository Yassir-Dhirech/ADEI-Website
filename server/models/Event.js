const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  time: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(100),
    defaultValue: ''
  },
  clubId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'clubs',
      key: 'id'
    }
  },
  organizer: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: 'ADEI'
  },
  image: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  document: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  link: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Lien externe vers plus d\'informations'
  },
  order_display: {
  type: DataTypes.INTEGER,
  allowNull: false,
  defaultValue: 0
}
}, {
  tableName: 'events',
  timestamps: true
});

module.exports = Event;
