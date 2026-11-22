const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EvaluationActivity = sequelize.define(
  'EvaluationActivity',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    evaluationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'evaluations',
        key: 'id',
      },
    },

    // Identificador estable dentro de la evaluación.
    // Ejemplos: verdadero_falso, completar, relacionar.
    activity_key: {
      type: DataTypes.STRING(60),
      allowNull: false,
    },

    type: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {
        isIn: [
          [
            'true_false',
            'fill_blanks',
            'matching',
            'ordering',
            'case_study',
          ],
        ],
      },
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    instructions: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    // Cada actividad completa vale 2 puntos.
    // El controlador calculará los puntos parciales.
    score: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 2,
      validate: {
        min: 0.01,
      },
    },

    order_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },

    // Información que podrá recibir el participante:
    // afirmaciones, palabras, conceptos y pasos.
    public_config: {
      type: DataTypes.JSONB,
      allowNull: false,
    },

    // Soluciones utilizadas exclusivamente en el servidor
    // para validar y calificar las respuestas.
    solution: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
  },
  {
    tableName: 'evaluation_activities',
    timestamps: true,

    indexes: [
      {
        unique: true,
        fields: ['evaluationId', 'activity_key'],
      },
      {
        unique: true,
        fields: ['evaluationId', 'order_number'],
      },
    ],

    // Las consultas normales no incluyen las soluciones.
    defaultScope: {
      attributes: {
        exclude: ['solution'],
      },
    },

    // Solo el controlador de calificación utilizará
    // este scope para consultar las soluciones.
    scopes: {
      withSolution: {
        attributes: {
          include: ['solution'],
        },
      },
    },
  }
);

module.exports = EvaluationActivity;