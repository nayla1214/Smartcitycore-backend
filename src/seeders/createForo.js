require('dotenv').config();

const { sequelize, Foro } = require('../models');

async function main() {
  try {
    await sequelize.authenticate();
    await Foro.sync();
    console.log('Tabla forum_posts creada correctamente.');
  } catch (error) {
    console.error('Error al crear la tabla:', error);
  } finally {
    await sequelize.close();
  }
}

main();