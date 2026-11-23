require('dotenv').config();

const sequelize = require(
  '../config/database'
);

const ForumNotificationRead = require(
  '../models/ForumNotificationRead'
);

const createForumNotificationTable =
  async () => {
    try {
      await sequelize.authenticate();

      // Crea la tabla si todavía no existe.
      // No elimina los registros existentes.
      await ForumNotificationRead.sync();

      console.log(
        'Tabla de lectura de notificaciones preparada correctamente.'
      );
    } catch (error) {
      console.error(
        'No se pudo preparar la tabla de notificaciones:',
        error
      );

      process.exitCode = 1;
    } finally {
      await sequelize.close();
    }
  };

createForumNotificationTable();