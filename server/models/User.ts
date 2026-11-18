import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface UserAttributes {
  id: number;
  username: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  is_president: boolean;
  is_representant: boolean;
  is_membre_adei: boolean;
  is_bureau_adei: boolean;
  lastPasswordChange: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserCreationAttributes = Optional<
  UserAttributes,
  'id' | 'role' | 'is_president' | 'is_representant' | 'is_membre_adei' | 'is_bureau_adei' | 'lastPasswordChange'
>;

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: number;
  declare username: string;
  declare email: string;
  declare password: string;
  declare role: 'user' | 'admin';
  declare is_president: boolean;
  declare is_representant: boolean;
  declare is_membre_adei: boolean;
  declare is_bureau_adei: boolean;
  declare lastPasswordChange: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

User.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true } },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: { len: { args: [8, 255], msg: 'Le mot de passe doit contenir au moins 8 caractères' } }
  },
  role: { type: DataTypes.ENUM('user', 'admin'), defaultValue: 'user' },
  is_president: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_representant: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_membre_adei: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_bureau_adei: { type: DataTypes.BOOLEAN, defaultValue: false },
  lastPasswordChange: { type: DataTypes.DATE, allowNull: true, defaultValue: null }
}, {
  sequelize,
  tableName: 'users',
  timestamps: true
});

export default User;
