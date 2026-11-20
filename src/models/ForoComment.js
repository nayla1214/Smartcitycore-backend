const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ForoComment = sequelize.define(
  'ForoComment',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    postId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: 'forum_comments',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['postId', 'userId'],
      },
    ],
  }
);

module.exports = ForoComment;