const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Topic = sequelize.define(
  'Topic',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    moduleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'modules',
        key: 'id',
      },
      onDelete: 'RESTRICT',
    },

    topicNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    introduction: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
    },

    order_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: 'course_topics',
    timestamps: true,

    indexes: [
      {
        unique: true,
        fields: ['moduleId', 'topicNumber'],
      },
      {
        unique: true,
        fields: ['moduleId', 'order_number'],
      },
    ],
  }
);

module.exports = Topic;