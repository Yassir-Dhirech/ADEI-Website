import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface OtpAttributes {
  id: number;
  email: string;
  code: string;
  expires_at: Date;
  verified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type OtpCreationAttributes = Optional<OtpAttributes, 'id' | 'verified'>;

export class Otp extends Model<OtpAttributes, OtpCreationAttributes> implements OtpAttributes {
  declare id: number;
  declare email: string;
  declare code: string;
  declare expires_at: Date;
  declare verified: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Otp.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING(255), allowNull: false },
    code: { type: DataTypes.STRING(10), allowNull: false },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    verified: { type: DataTypes.BOOLEAN, defaultValue: false }
  },
  {
    sequelize,
    tableName: 'otps',
    timestamps: true
  }
);

export default Otp;
