const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EventOrganizer = sequelize.define('EventOrganizer', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  eventId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'events', key: 'id' } },
  clubId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'clubs', key: 'id' } },
  organizerName: { type: DataTypes.STRING(255), allowNull: false }
}, {
  tableName: 'event_organizers',
  timestamps: true
});

module.exports = EventOrganizer;