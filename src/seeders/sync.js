require('dotenv').config();
const { sequelize } = require('../models');

async function syncDatabase() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Sincronizar todos los modelos
        // Usar force: true solo en desarrollo para reiniciar la BD,
        // o alter: true para actualizar tablas existentes sin borrar datos.
        await sequelize.sync({ force: true });
        console.log('All models were synchronized successfully.');
        
        process.exit(0);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

syncDatabase();
