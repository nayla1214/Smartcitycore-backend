require('dotenv').config();

const sequelize = require('./src/config/database');
const CourseSurvey = require('./src/models/CourseSurvey');

async function createTable() {
  try {
    await sequelize.authenticate();

    await CourseSurvey.sync();

    console.log(
      'La tabla de encuestas está preparada correctamente.'
    );
  } catch (error) {
    console.error(
      'No se pudo preparar la tabla de encuestas:',
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

createTable();