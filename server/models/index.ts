import sequelize from '../config/database';
import User from './User';
import News from './News';
import Event from './Event';
import Club from './Club';
import Feedback from './Feedback';
import ADEIMember from './ADEIMember';
import Filiere from './Filiere';
import Partner from './Partner';
import FeedbackLike from './FeedbackLike';
import EventOrganizer from './EventOrganizer';
import AdeiRole from './AdeiRole';
import Cycle from './Cycle';
import AcademicYear from './AcademicYear';
import Section from './Section';

// Associations
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

News.belongsTo(Club, { foreignKey: 'clubId', as: 'club' });
Event.belongsTo(Club, { foreignKey: 'clubId', as: 'club' });
Club.hasMany(News, { foreignKey: 'clubId', as: 'news' });
Club.hasMany(Event, { foreignKey: 'clubId', as: 'events' });

User.hasMany(Feedback, { foreignKey: 'userId', as: 'feedbacks' });
Feedback.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export {
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
