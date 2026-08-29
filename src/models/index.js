const sequelize = require('../config/database');

const User = require('./User');
const Gad = require('./Gad');
const Course = require('./Course');
const Module = require('./Module');
const Video = require('./Video');
const VideoProgress = require('./VideoProgress');
const Evaluation = require('./Evaluation');
const Question = require('./Question');
const Option = require('./Option');
const EvaluationAttempt = require('./EvaluationAttempt');
const UserCourse = require('./UserCourse');
const Certificate = require('./Certificate');

// Relaciones de Curso y Módulos
Course.hasMany(Module, { foreignKey: 'courseId' });
Module.belongsTo(Course, { foreignKey: 'courseId' });

// Relaciones de Módulo y Videos
Module.hasMany(Video, { foreignKey: 'moduleId' });
Video.belongsTo(Module, { foreignKey: 'moduleId' });

// Relaciones de Evaluaciones
Module.hasOne(Evaluation, { foreignKey: 'moduleId' });
Evaluation.belongsTo(Module, { foreignKey: 'moduleId' });

Course.hasOne(Evaluation, { foreignKey: 'courseId' }); // Para la evaluación final
Evaluation.belongsTo(Course, { foreignKey: 'courseId' });

Evaluation.hasMany(Question, { foreignKey: 'evaluationId' });
Question.belongsTo(Evaluation, { foreignKey: 'evaluationId' });

Question.hasMany(Option, { foreignKey: 'questionId' });
Option.belongsTo(Question, { foreignKey: 'questionId' });

// Relaciones de Progreso de Usuario
User.hasMany(VideoProgress, { foreignKey: 'userId' });
VideoProgress.belongsTo(User, { foreignKey: 'userId' });

Video.hasMany(VideoProgress, { foreignKey: 'videoId' });
VideoProgress.belongsTo(Video, { foreignKey: 'videoId' });

User.hasMany(EvaluationAttempt, { foreignKey: 'userId' });
EvaluationAttempt.belongsTo(User, { foreignKey: 'userId' });

Evaluation.hasMany(EvaluationAttempt, { foreignKey: 'evaluationId' });
EvaluationAttempt.belongsTo(Evaluation, { foreignKey: 'evaluationId' });

User.hasMany(UserCourse, { foreignKey: 'userId' });
UserCourse.belongsTo(User, { foreignKey: 'userId' });

Course.hasMany(UserCourse, { foreignKey: 'courseId' });
UserCourse.belongsTo(Course, { foreignKey: 'courseId' });

// Certificados
User.hasMany(Certificate, { foreignKey: 'userId' });
Certificate.belongsTo(User, { foreignKey: 'userId' });

Course.hasMany(Certificate, { foreignKey: 'courseId' });
Certificate.belongsTo(Course, { foreignKey: 'courseId' });

module.exports = {
    sequelize,
    User,
    Gad,
    Course,
    Module,
    Video,
    VideoProgress,
    Evaluation,
    Question,
    Option,
    EvaluationAttempt,
    UserCourse,
    Certificate
};
