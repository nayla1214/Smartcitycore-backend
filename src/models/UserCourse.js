const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserCourse = sequelize.define('UserCourse', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    courseId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    current_module_id: {
        type: DataTypes.INTEGER,
        allowNull: true // si aún no empieza o está por defecto en el primer módulo
    },
    is_completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    final_score: {
        type: DataTypes.FLOAT
    }
}, {
    tableName: 'user_courses',
    timestamps: true
});

module.exports = UserCourse;
