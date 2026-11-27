require('dotenv').config();

const app = require('./src/app');
const sequelize = require('./src/config/database');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await sequelize.authenticate();

    console.log(
      'Database connection has been established successfully.'
    );

    // Los cambios de estructura se aplican
    // mediante los scripts de migración.
    // No se modifica automáticamente la base de datos.

    app.listen(PORT, () => {
      console.log(
        `Server is running on port ${PORT}`
      );
    });
  } catch (error) {
    console.error(
      'Unable to connect to the database:',
      error
    );

    process.exitCode = 1;
  }
}

startServer();