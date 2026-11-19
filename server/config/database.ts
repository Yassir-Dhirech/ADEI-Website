import { Sequelize } from 'sequelize';
import env from './env';

const isSslEnabled =
  process.env.DB_SSL === 'true' ||
  (env.isProduction && !env.DB.host.includes('localhost') && !env.DB.host.includes('postgres'));

const dialectOptions =
  env.DB.dialect === 'postgres' && isSslEnabled
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {};

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: (env.DB.dialect || 'postgres') as 'postgres' | 'mysql',
      logging: false,
      dialectOptions,
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
    })
  : new Sequelize({
      dialect: env.DB.dialect,
      host: env.DB.host,
      port: env.DB.port,
      database: env.DB.name,
      username: env.DB.user,
      password: env.DB.password,
      logging: false,
      dialectOptions,
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