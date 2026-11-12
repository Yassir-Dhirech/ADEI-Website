const sequelize = require('../config/database');
const User = require('./User');
const News = require('./News');
const Event = require('./Event');
const Club = require('./Club');
const Feedback = require('./Feedback');
const ADEIMember = require('./ADEIMember');
const Filiere = require('./Filiere');
const Partner = require('./Partner');

// Define model associations
News.belongsTo(Club, { foreignKey: 'clubId', as: 'club' });
Event.belongsTo(Club, { foreignKey: 'clubId', as: 'club' });
Club.hasMany(News, { foreignKey: 'clubId', as: 'news' });
Club.hasMany(Event, { foreignKey: 'clubId', as: 'events' });

// User and Feedback associations
User.hasMany(Feedback, { foreignKey: 'userId', as: 'feedbacks' });
Feedback.belongsTo(User, { foreignKey: 'userId', as: 'user' });

const models = {
  User,
  News,
  Event,
  Club,
  Feedback,
  ADEIMember,
  Filiere,
  Partner,
  sequelize
};

module.exports = models;