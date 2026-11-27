const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CourseTeacher = sequelize.define(
  'CourseTeacher',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },

    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'courses',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  },
  {
    tableName: 'course_teachers',
    timestamps: true,

    indexes: [
      {
        name: 'course_teachers_user_course_unique',
        unique: true,
        fields: ['userId', 'courseId'],
      },
    ],
  }
);

module.exports = CourseTeacher;