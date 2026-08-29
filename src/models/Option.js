const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Option = sequelize.define('Option', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    questionId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    text: {
        type: DataTypes.STRING,
        allowNull: false
    },
    is_correct: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'options',
    timestamps: true
});

module.exports = Option;
