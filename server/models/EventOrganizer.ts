import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class EventOrganizer extends Model {
  declare id: number;
  declare eventId: number;
  declare clubId: number | null;
  declare organizerName: string;
}

EventOrganizer.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  eventId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'events', key: 'id' } },
  clubId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'clubs', key: 'id' } },
  organizerName: { type: DataTypes.STRING(255), allowNull: false }
}, {
  sequelize,
  tableName: 'event_organizers',
  timestamps: true
});

export default EventOrganizer;
