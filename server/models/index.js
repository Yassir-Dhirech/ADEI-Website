const sequelize = require('../config/database');
const User = require('./User');
const News = require('./News');
const Event = require('./Event');
const Club = require('./Club');
const Feedback = require('./Feedback');
const ADEIMember = require('./ADEIMember');
const Filiere = require('./Filiere');
const Partner = require('./Partner');
const FeedbackLike = require('./FeedbackLike');
const EventOrganizer = require('./EventOrganizer');
const AdeiRole = require('./AdeiRole');
const Cycle = require('./Cycle');
const AcademicYear = require('./AcademicYear');
const Section = require('./Section');


Feedback.hasMany(FeedbackLike, { foreignKey: 'feedbackId', as: 'likes' });
FeedbackLike.belongsTo(Feedback, { foreignKey: 'feedbackId', as: 'feedback' });
User.hasMany(FeedbackLike, { foreignKey: 'userId', as: 'feedbackLikes' });
Event.hasMany(EventOrganizer, { foreignKey: 'eventId', as: 'organizers' });
EventOrganizer.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });
EventOrganizer.belongsTo(Club, { foreignKey: 'clubId', as: 'club' });
AdeiRole.hasMany(ADEIMember, { foreignKey: 'roleId', as: 'members' });
ADEIMember.belongsTo(AdeiRole, { foreignKey: 'roleId', as: 'roleInfo' });

Cycle.hasMany(AcademicYear, { foreignKey: 'cycleId', as: 'years' });
AcademicYear.belongsTo(Cycle, { foreignKey: 'cycleId', as: 'cycle' });
Filiere.hasMany(AcademicYear, { foreignKey: 'filiereId', as: 'years' });
AcademicYear.belongsTo(Filiere, { foreignKey: 'filiereId', as: 'filiere' });
AcademicYear.hasMany(Section, { foreignKey: 'academicYearId', as: 'sections' });
Section.belongsTo(AcademicYear, { foreignKey: 'academicYearId', as: 'academicYear' });

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
  FeedbackLike,
  EventOrganizer,
  AdeiRole,
  Cycle,
  AcademicYear,
  Section,
  sequelize
};

module.exports = models;