const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PracticalSubmission = sequelize.define(
  'PracticalSubmission',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    evaluationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    answers: {
      type: DataTypes.JSONB,
      allowNull: false,
    },

    image: {
      type: DataTypes.BLOB,
      allowNull: false,
    },
  },
  {
    tableName: 'practical_submissions',
    timestamps: true,

    indexes: [
      {
        unique: true,
        fields: ['userId', 'evaluationId'],
      },
    ],
  }
);

module.exports = PracticalSubmission;