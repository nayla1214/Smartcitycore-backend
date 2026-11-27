const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ComplementaryVideo = sequelize.define(
  'ComplementaryVideo',
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
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },

    // Los registros anteriores pueden quedar sin tema
    // hasta que el docente les asigne uno.
    topicNumber: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },

    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },

    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
    },

    youtubeId: {
      type: DataTypes.STRING(11),
      allowNull: false,
    },
  },
  {
    tableName: 'complementary_videos',
    timestamps: true,

    indexes: [
      {
        name: 'complementary_video_module_youtube_unique',
        unique: true,
        fields: ['moduleId', 'youtubeId'],
      },
    ],
  }
);

module.exports = ComplementaryVideo;