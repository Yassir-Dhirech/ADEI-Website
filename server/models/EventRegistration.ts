import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface EventRegistrationAttributes {
  id: number;
  userId: number;
  eventId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type EventRegistrationCreationAttributes = Optional<EventRegistrationAttributes, 'id'>;

export class EventRegistration
  extends Model<EventRegistrationAttributes, EventRegistrationCreationAttributes>
  implements EventRegistrationAttributes {
  declare id: number;
  declare userId: number;
  declare eventId: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

EventRegistration.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'events', key: 'id' }
    }
  },
  {
    sequelize,
    tableName: 'event_registrations',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'eventId'],
        name: 'unique_user_event_registration'
      }
    ]
  }
);

export default EventRegistration;
