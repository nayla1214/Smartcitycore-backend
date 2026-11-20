require('dotenv').config();

const { sequelize, Module, Video } = require('../models');

async function main() {
  try {
    await sequelize.authenticate();

    const module = await Module.findByPk(1);

    if (!module || Number(module.courseId) !== 1) {
      throw new Error(
        'No se encontró el módulo 1 del curso 1.'
      );
    }

    // Sincroniza la secuencia si se insertaron IDs manualmente.
    await sequelize.query(`
      SELECT setval(
        pg_get_serial_sequence('"videos"', 'id'),
        COALESCE((SELECT MAX("id") FROM "videos"), 1),
        EXISTS (SELECT 1 FROM "videos")
      );
    `);

    const [video, created] = await Video.findOrCreate({
      where: {
        moduleId: module.id,
        url: '9oOPvXQliTo',
      },
      defaults: {
        moduleId: module.id,
        title:
          'Tema 1.4: Plataforma web de urbanismo inteligente',
        description:
          'Plataforma web de urbanismo inteligente y su aplicación en la gestión municipal.',
        url: '9oOPvXQliTo',
        duration: 429,
        order_number: 4,
        status: true,
      },
    });

    console.log(
      created
        ? `Video 1.4 creado correctamente con ID ${video.id}.`
        : `El video 1.4 ya existía con ID ${video.id}.`
    );
  } catch (error) {
    console.error('Error registrando el video 1.4:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();