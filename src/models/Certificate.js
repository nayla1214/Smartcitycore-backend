const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Certificate = sequelize.define(
  'Certificate',
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

    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    unique_code: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
    },

    issue_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    // Datos definitivos guardados al emitir.
    // Los registros antiguos permanecen sin emitir
    // hasta comprobar sus requisitos.
    issued_snapshot: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    tableName: 'certificates',
    timestamps: false,
  }
);

module.exports = Certificate;