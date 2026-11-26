import { DataTypes, Model, Optional, Op } from 'sequelize';
import sequelize from '../config/database';

export interface EventRegistrationAttributes {
  id: number;
  userId?: number | null;
  eventId: number;
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  guestFiliere?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type EventRegistrationCreationAttributes = Optional<
  EventRegistrationAttributes,
  'id' | 'userId' | 'guestName' | 'guestEmail' | 'guestPhone' | 'guestFiliere'
>;

export class EventRegistration
  extends Model<EventRegistrationAttributes, EventRegistrationCreationAttributes>
  implements EventRegistrationAttributes {
  declare id: number;
  declare userId: number | null;
  declare eventId: number;
  declare guestName: string | null;
  declare guestEmail: string | null;
  declare guestPhone: string | null;
  declare guestFiliere: string | null;
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
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'events', key: 'id' }
    },
    guestName: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    guestEmail: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    guestPhone: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    guestFiliere: {
      type: DataTypes.STRING(100),
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'event_registrations',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['eventId', 'userId'],
        name: 'unique_user_event_registration',
        where: {
          userId: { [Op.ne]: null }
        }
      },
      {
        unique: true,
        fields: ['eventId', 'guestEmail'],
        name: 'unique_guest_event_registration',
        where: {
          userId: null
        }
      }
    ]
  }
);

export default EventRegistration;
