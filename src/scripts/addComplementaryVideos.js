require('dotenv').config();

const sequelize = require('../config/database');

const ComplementaryVideo =
  require('../models/ComplementaryVideo');

const run = async () => {
  try {
    await sequelize.authenticate();

    // Crea únicamente la tabla nueva.
    // No altera ni borra las tablas existentes.
    await ComplementaryVideo.sync();

    console.log(
      'Tabla de videos complementarios preparada correctamente.'
    );
  } catch (error) {
    console.error(
      'No se pudo preparar la tabla:',
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();