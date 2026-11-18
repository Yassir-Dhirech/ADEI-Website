require('dotenv').config();

const dialect = (process.env.DB_DIALECT || 'postgres').toLowerCase();
const dbConfig = {
  dialect,
  host: process.env.DB_HOST || dialect,
  port: parseInt(process.env.DB_PORT, 10) || (dialect === 'postgres' ? 5432 : 3306),
  database: process.env.DB_NAME || (dialect === 'postgres' ? 'adei_pg' : 'adei_db'),
  username: process.env.DB_USER || (dialect === 'postgres' ? 'adei_pg_user' : 'adei_user'),
  password: process.env.DB_PASSWORD || ''
};

module.exports = {
  development: dbConfig,
  test: dbConfig,
  production: dbConfig
};
