const sequelize = require('../config/database');

const User = require('./User');
const Gad = require('./Gad');
const Course = require('./Course');
const Module = require('./Module');
const Video = require('./Video');
const VideoProgress = require('./VideoProgress');
const Evaluation = require('./Evaluation');
const EvaluationActivity = require('./EvaluationActivity');
const Question = require('./Question');
const Option = require('./Option');
const EvaluationAttempt = require('./EvaluationAttempt');
const UserCourse = require('./UserCourse');
const Certificate = require('./Certificate');
const Foro = require('./Foro');
const ForoComment = require('./ForoComment');
const Topic = require('./Topic');
// Relaciones de curso y módulos
Course.hasMany(Module, { foreignKey: 'courseId' });
Module.belongsTo(Course, { foreignKey: 'courseId' });

// Relaciones de módulo y videos
Module.hasMany(Video, { foreignKey: 'moduleId' });
Video.belongsTo(Module, { foreignKey: 'moduleId' });

// Evaluaciones de los temas y del módulo
Module.hasMany(Evaluation, { foreignKey: 'moduleId' });
Evaluation.belongsTo(Module, { foreignKey: 'moduleId' });

// Evaluaciones asociadas al curso
Course.hasMany(Evaluation, { foreignKey: 'courseId' });
Evaluation.belongsTo(Course, { foreignKey: 'courseId' });

// Preguntas de las evaluaciones actuales
Evaluation.hasMany(Question, { foreignKey: 'evaluationId' });
Question.belongsTo(Evaluation, { foreignKey: 'evaluationId' });

Question.hasMany(Option, { foreignKey: 'questionId' });
Option.belongsTo(Question, { foreignKey: 'questionId' });

// Actividades de las evaluaciones mixtas
Evaluation.hasMany(EvaluationActivity, {
  foreignKey: 'evaluationId',
  as: 'activities',
});

EvaluationActivity.belongsTo(Evaluation, {
  foreignKey: 'evaluationId',
  as: 'evaluation',
});

// Relaciones de progreso de usuario
User.hasMany(VideoProgress, { foreignKey: 'userId' });
VideoProgress.belongsTo(User, { foreignKey: 'userId' });

Video.hasMany(VideoProgress, { foreignKey: 'videoId' });
VideoProgress.belongsTo(Video, { foreignKey: 'videoId' });

// Intentos de evaluación
User.hasMany(EvaluationAttempt, { foreignKey: 'userId' });
EvaluationAttempt.belongsTo(User, { foreignKey: 'userId' });

Evaluation.hasMany(EvaluationAttempt, {
  foreignKey: 'evaluationId',
});

EvaluationAttempt.belongsTo(Evaluation, {
  foreignKey: 'evaluationId',
});
// Temas de cada módulo.
Module.hasMany(Topic, {
  foreignKey: 'moduleId',
});

Topic.belongsTo(Module, {
  foreignKey: 'moduleId',
});
// Inscripciones y progreso del curso
User.hasMany(UserCourse, { foreignKey: 'userId' });
UserCourse.belongsTo(User, { foreignKey: 'userId' });

Course.hasMany(UserCourse, { foreignKey: 'courseId' });
UserCourse.belongsTo(Course, { foreignKey: 'courseId' });

// Certificados
User.hasMany(Certificate, { foreignKey: 'userId' });
Certificate.belongsTo(User, { foreignKey: 'userId' });

Course.hasMany(Certificate, { foreignKey: 'courseId' });
Certificate.belongsTo(Course, { foreignKey: 'courseId' });

// Publicaciones del foro
User.hasMany(Foro, { foreignKey: 'userId' });
Foro.belongsTo(User, { foreignKey: 'userId' });

// Comentarios en publicaciones del foro
Foro.hasMany(ForoComment, { foreignKey: 'postId' });
ForoComment.belongsTo(Foro, { foreignKey: 'postId' });

User.hasMany(ForoComment, { foreignKey: 'userId' });
ForoComment.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  Gad,
  Course,
  Module,
  Video,
  VideoProgress,
  Evaluation,
  EvaluationActivity,
  Question,
  Option,
  EvaluationAttempt,
  UserCourse,
  Certificate,
  Topic,
  Foro,
  ForoComment,
};