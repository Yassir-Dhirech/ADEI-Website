import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type ClubMemberRole = 'president' | 'manager' | 'member';
export type ClubMemberStatus = 'pending' | 'active' | 'rejected' | 'left';

export interface ClubMemberAttributes {
  id: number;
  userId: number;
  clubId: number;
  role: ClubMemberRole;
  academicYear: string;
  status: ClubMemberStatus;
  pole: string | null;
  motivation: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ClubMemberCreationAttributes = Optional<
  ClubMemberAttributes,
  'id' | 'role' | 'status' | 'pole' | 'motivation'
>;

export class ClubMember
  extends Model<ClubMemberAttributes, ClubMemberCreationAttributes>
  implements ClubMemberAttributes {
  declare id: number;
  declare userId: number;
  declare clubId: number;
  declare role: ClubMemberRole;
  declare academicYear: string;
  declare status: ClubMemberStatus;
  declare pole: string | null;
  declare motivation: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ClubMember.init(
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
    clubId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'clubs', key: 'id' }
    },
    role: {
      type: DataTypes.ENUM('president', 'manager', 'member'),
      allowNull: false,
      defaultValue: 'member'
    },
    academicYear: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'rejected', 'left'),
      allowNull: false,
      defaultValue: 'pending'
    },
    pole: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    motivation: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'club_members',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'clubId', 'academicYear'],
        name: 'unique_user_club_academic_year'
      }
    ]
  }
);

export default ClubMember;
