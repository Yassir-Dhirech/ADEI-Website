const { Sequelize } = require('sequelize');
const { DB } = require('./env');

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: DB.host,
  port: DB.port,
  database: DB.name,
  username: DB.user,
  password: DB.password,
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

module.exports = sequelize;