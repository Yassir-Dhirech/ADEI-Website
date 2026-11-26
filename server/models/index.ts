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
import ClubMember from './ClubMember';
import EventRegistration from './EventRegistration';
import Otp from './Otp';
import AuditLog from './AuditLog';

// Associations
Feedback.hasMany(FeedbackLike, { foreignKey: 'feedbackId', as: 'likes' });
FeedbackLike.belongsTo(Feedback, { foreignKey: 'feedbackId', as: 'feedback' });
User.hasMany(FeedbackLike, { foreignKey: 'userId', as: 'feedbackLikes' });

// Club Memberships (Presidents, Managers, Members by Academic Year)
User.hasMany(ClubMember, { foreignKey: 'userId', as: 'clubMemberships' });
ClubMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Club.hasMany(ClubMember, { foreignKey: 'clubId', as: 'clubMembers' });
ClubMember.belongsTo(Club, { foreignKey: 'clubId', as: 'club' });
User.belongsToMany(Club, { through: ClubMember, foreignKey: 'userId', otherKey: 'clubId', as: 'clubs' });
Club.belongsToMany(User, { through: ClubMember, foreignKey: 'clubId', otherKey: 'userId', as: 'users' });

// Event Moderation Submitter & Reviewer
Event.belongsTo(User, { foreignKey: 'submittedBy', as: 'submitter' });
Event.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });

// Event Registrations (RSVP)
User.hasMany(EventRegistration, { foreignKey: 'userId', as: 'eventRegistrations' });
EventRegistration.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Event.hasMany(EventRegistration, { foreignKey: 'eventId', as: 'registrations' });
EventRegistration.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });
User.belongsToMany(Event, { through: EventRegistration, foreignKey: 'userId', otherKey: 'eventId', as: 'registeredEvents' });
Event.belongsToMany(User, { through: EventRegistration, foreignKey: 'eventId', otherKey: 'userId', as: 'attendees' });

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

User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

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
  ClubMember,
  EventRegistration,
  Otp,
  AuditLog,
  sequelize
};
