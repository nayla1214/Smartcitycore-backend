require('dotenv').config();

const ReadingProgress = require(
  '../models/ReadingProgress'
);

const sequelize = require(
  '../config/database'
);

const createReadingProgressTable =
  async () => {
    try {
      await sequelize.authenticate();

      // Crea la tabla si todavía no existe.
      // No elimina los registros existentes.
      await ReadingProgress.sync();

      console.log(
        'Tabla de seguimiento de lecturas preparada correctamente.'
      );
    } catch (error) {
      console.error(
        'No se pudo preparar la tabla de lecturas:',
        error
      );

      process.exitCode = 1;
    } finally {
      await sequelize.close();
    }
  };

createReadingProgressTable();