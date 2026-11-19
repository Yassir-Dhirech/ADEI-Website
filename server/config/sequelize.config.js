require('dotenv').config();

const isSsl = process.env.DB_SSL === 'true' || Boolean(process.env.DATABASE_URL);
const dialectOptions = isSsl ? { ssl: { require: true, rejectUnauthorized: false } } : {};

const dbConfig = process.env.DATABASE_URL
  ? {
      url: process.env.DATABASE_URL,
      dialect: 'postgres',
      dialectOptions
    }
  : {
      dialect: (process.env.DB_DIALECT || 'postgres').toLowerCase(),
      host: process.env.DB_HOST || (process.env.DB_DIALECT === 'mysql' ? 'mysql' : 'postgres'),
      port: parseInt(process.env.DB_PORT, 10) || (process.env.DB_DIALECT === 'mysql' ? 3306 : 5432),
      database: process.env.DB_NAME || (process.env.DB_DIALECT === 'mysql' ? 'adei_db' : 'adei_pg'),
      username: process.env.DB_USER || (process.env.DB_DIALECT === 'mysql' ? 'adei_user' : 'adei_pg_user'),
      password: process.env.DB_PASSWORD || '',
      dialectOptions
    };

module.exports = {
  development: dbConfig,
  test: dbConfig,
  production: dbConfig
};
