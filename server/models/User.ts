import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface UserAttributes {
  id: number;
  username: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  status: 'pending' | 'active' | 'rejected';
  phone?: string | null;
  filiere?: string | null;
  classe?: string | null;
  requested_role: 'user' | 'president' | 'delegue' | 'alumni';
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
  | 'id'
  | 'role'
  | 'status'
  | 'phone'
  | 'filiere'
  | 'classe'
  | 'requested_role'
  | 'is_president'
  | 'is_representant'
  | 'is_membre_adei'
  | 'is_bureau_adei'
  | 'lastPasswordChange'
>;

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: number;
  declare username: string;
  declare email: string;
  declare password: string;
  declare role: 'user' | 'admin';
  declare status: 'pending' | 'active' | 'rejected';
  declare phone: string | null;
  declare filiere: string | null;
  declare classe: string | null;
  declare requested_role: 'user' | 'president' | 'delegue' | 'alumni';
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
  status: {
    type: DataTypes.ENUM('pending', 'active', 'rejected'),
    allowNull: false,
    defaultValue: 'active'
  },
  phone: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  filiere: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  classe: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  requested_role: {
    type: DataTypes.ENUM('user', 'president', 'delegue', 'alumni'),
    allowNull: false,
    defaultValue: 'user'
  },
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
