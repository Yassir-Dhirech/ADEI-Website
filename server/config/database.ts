import { Sequelize } from 'sequelize';
import env from './env';

const sequelize = new Sequelize({
  dialect: env.DB.dialect,
  host: env.DB.host,
  port: env.DB.port,
  database: env.DB.name,
  username: env.DB.user,
  password: env.DB.password,
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true
  }
});

export = sequelize;
