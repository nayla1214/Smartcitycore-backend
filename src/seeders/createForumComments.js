require('dotenv').config();

const {
  sequelize,
  ForoComment,
} = require('../models');

async function main() {
  try {
    await sequelize.authenticate();
    await ForoComment.sync();

    console.log('Tabla forum_comments lista.');
  } catch (error) {
    console.error(
      'Error creando forum_comments:',
      error
    );
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();