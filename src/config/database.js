const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false // Importante para la conexión con Neon PostgreSQL
        }
    },
    logging: false, // Desactivar log SQL en consola
});

module.exports = sequelize;
