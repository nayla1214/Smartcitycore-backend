const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CourseSurvey = sequelize.define(
  'CourseSurvey',
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
    },

    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'courses',
        key: 'id',
      },
    },

    answers: {
      type: DataTypes.JSONB,
      allowNull: false,
    },

    recommendation: {
      type: DataTypes.ENUM('YES', 'MAYBE', 'NO'),
      allowNull: false,
    },

    liked: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
    },

    improvements: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
    },
  },
  {
    tableName: 'course_surveys',
    timestamps: true,

    indexes: [
      {
        unique: true,
        fields: ['userId', 'courseId'],
      },
    ],
  }
);

module.exports = CourseSurvey;