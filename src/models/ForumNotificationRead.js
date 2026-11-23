const {
  DataTypes,
} = require('sequelize');

const sequelize = require(
  '../config/database'
);

// Guarda cuáles avisos de comentarios
// ya fueron leídos por cada usuario.
const ForumNotificationRead = sequelize.define(
  'ForumNotificationRead',
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

    commentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: 'forum_notification_reads',

    timestamps: true,

    indexes: [
      {
        unique: true,
        fields: [
          'userId',
          'commentId',
        ],
      },
    ],
  }
);

module.exports = ForumNotificationRead;