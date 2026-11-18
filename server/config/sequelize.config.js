const { DB } = require('./env');

const dbConfig = {
  dialect: DB.dialect,
  host: DB.host,
  port: DB.port,
  database: DB.name,
  username: DB.user,
  password: DB.password
};

module.exports = {
  development: dbConfig,
  test: dbConfig,
  production: dbConfig
};