import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import type { User } from './User';

export interface AuditLogAttributes {
  id: number;
  userId?: number | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type AuditLogCreationAttributes = Optional<
  AuditLogAttributes,
  'id' | 'userId' | 'actorEmail' | 'actorRole' | 'resourceId' | 'details' | 'ipAddress' | 'userAgent'
>;

export class AuditLog
  extends Model<AuditLogAttributes, AuditLogCreationAttributes>
  implements AuditLogAttributes {
  declare id: number;
  declare userId: number | null;
  declare actorEmail: string | null;
  declare actorRole: string | null;
  declare action: string;
  declare resourceType: string;
  declare resourceId: string | null;
  declare details: Record<string, unknown> | null;
  declare ipAddress: string | null;
  declare userAgent: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  declare readonly user?: User;
}

AuditLog.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    actorEmail: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    actorRole: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    resourceType: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    resourceId: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    details: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    userAgent: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'audit_logs',
    timestamps: true
  }
);

export default AuditLog;
