const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Evaluation = sequelize.define('Evaluation', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    moduleId: {
        type: DataTypes.INTEGER,
        allowNull: true // Puede ser nulo si es la evaluación final del curso
    },
    courseId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    is_final: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'evaluations',
    timestamps: true
});

module.exports = Evaluation;
