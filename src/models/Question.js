const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Question = sequelize.define('Question', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    evaluationId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    text: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    score: {
        type: DataTypes.FLOAT,
        defaultValue: 1
    }
}, {
    tableName: 'questions',
    timestamps: true
});

module.exports = Question;
