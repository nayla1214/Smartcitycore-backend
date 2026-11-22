const {
  DataTypes,
} = require('sequelize');

const sequelize = require(
  '../config/database'
);

// Se carga directamente desde los controladores.
// No requiere modificar models/index.js.
const ReadingProgress = sequelize.define(
  'ReadingProgress',
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

    topicNumber: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },

    url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    urlHash: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
  },
  {
    tableName: 'reading_progress',

    timestamps: true,

    indexes: [
      {
        unique: true,
        fields: [
          'userId',
          'topicNumber',
          'urlHash',
        ],
      },
    ],
  }
);

module.exports = ReadingProgress;