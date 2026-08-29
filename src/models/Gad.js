const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Gad = sequelize.define('Gad', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true // 'Paján', 'Puerto López', 'Jipijapa'
    },
    description: {
        type: DataTypes.TEXT
    },
    institutional_info: {
        type: DataTypes.TEXT
    },
    projects: {
        type: DataTypes.JSON // array de objetos o texto libre
    },
    activities: {
        type: DataTypes.JSON
    },
    media_urls: {
        type: DataTypes.JSON // para almacenar URLs de fotos y videos
    }
}, {
    tableName: 'gads',
    timestamps: true
});

module.exports = Gad;
