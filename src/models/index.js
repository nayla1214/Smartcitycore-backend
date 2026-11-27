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
const CourseTeacher = require('./CourseTeacher');

// Cursos y módulos
Course.hasMany(Module, {
  foreignKey: 'courseId',
});

Module.belongsTo(Course, {
  foreignKey: 'courseId',
});

// Módulos y videos
Module.hasMany(Video, {
  foreignKey: 'moduleId',
});

Video.belongsTo(Module, {
  foreignKey: 'moduleId',
});

// Evaluaciones de los módulos
Module.hasMany(Evaluation, {
  foreignKey: 'moduleId',
});

Evaluation.belongsTo(Module, {
  foreignKey: 'moduleId',
});

// Evaluaciones del curso
Course.hasMany(Evaluation, {
  foreignKey: 'courseId',
});

Evaluation.belongsTo(Course, {
  foreignKey: 'courseId',
});

// Preguntas y opciones
Evaluation.hasMany(Question, {
  foreignKey: 'evaluationId',
});

Question.belongsTo(Evaluation, {
  foreignKey: 'evaluationId',
});

Question.hasMany(Option, {
  foreignKey: 'questionId',
});

Option.belongsTo(Question, {
  foreignKey: 'questionId',
});

// Actividades de evaluaciones mixtas
Evaluation.hasMany(EvaluationActivity, {
  foreignKey: 'evaluationId',
  as: 'activities',
});

EvaluationActivity.belongsTo(Evaluation, {
  foreignKey: 'evaluationId',
  as: 'evaluation',
});

// Progreso de videos
User.hasMany(VideoProgress, {
  foreignKey: 'userId',
});

VideoProgress.belongsTo(User, {
  foreignKey: 'userId',
});

Video.hasMany(VideoProgress, {
  foreignKey: 'videoId',
});

VideoProgress.belongsTo(Video, {
  foreignKey: 'videoId',
});

// Intentos de evaluación
User.hasMany(EvaluationAttempt, {
  foreignKey: 'userId',
});

EvaluationAttempt.belongsTo(User, {
  foreignKey: 'userId',
});

Evaluation.hasMany(EvaluationAttempt, {
  foreignKey: 'evaluationId',
});

EvaluationAttempt.belongsTo(Evaluation, {
  foreignKey: 'evaluationId',
});

// Temas
Module.hasMany(Topic, {
  foreignKey: 'moduleId',
});

Topic.belongsTo(Module, {
  foreignKey: 'moduleId',
});

// Inscripciones de participantes
User.hasMany(UserCourse, {
  foreignKey: 'userId',
});

UserCourse.belongsTo(User, {
  foreignKey: 'userId',
});

Course.hasMany(UserCourse, {
  foreignKey: 'courseId',
});

UserCourse.belongsTo(Course, {
  foreignKey: 'courseId',
});

// Asignaciones de docentes
User.hasMany(CourseTeacher, {
  foreignKey: 'userId',
  as: 'teachingAssignments',
});

CourseTeacher.belongsTo(User, {
  foreignKey: 'userId',
  as: 'teacher',
});

Course.hasMany(CourseTeacher, {
  foreignKey: 'courseId',
  as: 'teacherAssignments',
});

CourseTeacher.belongsTo(Course, {
  foreignKey: 'courseId',
  as: 'course',
});

// Certificados
User.hasMany(Certificate, {
  foreignKey: 'userId',
});

Certificate.belongsTo(User, {
  foreignKey: 'userId',
});

Course.hasMany(Certificate, {
  foreignKey: 'courseId',
});

Certificate.belongsTo(Course, {
  foreignKey: 'courseId',
});

// Publicaciones del foro
User.hasMany(Foro, {
  foreignKey: 'userId',
});

Foro.belongsTo(User, {
  foreignKey: 'userId',
});

// Comentarios del foro
Foro.hasMany(ForoComment, {
  foreignKey: 'postId',
});

ForoComment.belongsTo(Foro, {
  foreignKey: 'postId',
});

User.hasMany(ForoComment, {
  foreignKey: 'userId',
});

ForoComment.belongsTo(User, {
  foreignKey: 'userId',
});

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
  CourseTeacher,
};