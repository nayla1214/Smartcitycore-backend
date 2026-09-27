const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Foro = sequelize.define('Foro', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  topicNumber: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'forum_posts',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'topicNumber']
    }
  ]
});

module.exports = Foro;