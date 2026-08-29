const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EvaluationAttempt = sequelize.define('EvaluationAttempt', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    evaluationId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    score: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    passed: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    attempted_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'evaluation_attempts',
    timestamps: false
});

module.exports = EvaluationAttempt;
