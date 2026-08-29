const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VideoProgress = sequelize.define('VideoProgress', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    videoId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    percentage: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    time_watched: {
        type: DataTypes.INTEGER, // segundos visualizados
        defaultValue: 0
    },
    is_completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    completed_at: {
        type: DataTypes.DATE
    }
}, {
    tableName: 'video_progress',
    timestamps: true
});

module.exports = VideoProgress;
