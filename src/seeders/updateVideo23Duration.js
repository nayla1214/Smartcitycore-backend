require('dotenv').config();

const { sequelize, Video } = require('../models');

async function main() {
  try {
    await sequelize.authenticate();

    const video = await Video.findOne({
      where: {
        moduleId: 2,
        url: 'mUOt_GcwS0E',
      },
    });

    if (!video) {
      throw new Error('No se encontró el video del tema 2.3.');
    }

    await video.update({
      duration: 400,
    });

    console.log(
      `Video 2.3, ID ${video.id}: duración actualizada a 400 segundos (6:40).`
    );
  } catch (error) {
    console.error('Error:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();