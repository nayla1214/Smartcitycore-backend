require('dotenv').config();

const { sequelize, Module, Video } = require('../models');

async function main() {
  try {
    await sequelize.authenticate();

    const module = await Module.findByPk(1);

    if (!module) {
      throw new Error(
        'El módulo 1 no existe en la base de datos.'
      );
    }

    // El video 1.1 se creó con ID 1 manualmente.
    // Ajustamos el contador para que PostgreSQL asigne
    // un ID libre al próximo video.
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
        url: 't7Yng5_mHzw',
      },
      defaults: {
        moduleId: module.id,
        title:
          'Tema 1.2: Gobernanza inteligente y ciudadanía digital',
        description:
          'Gobernanza inteligente, gobierno abierto y ciudadanía digital.',
        url: 't7Yng5_mHzw',
        duration: 163,
        order_number: 2,
        status: true,
      },
    });

    console.log(
      created
        ? `Video 1.2 creado correctamente con ID ${video.id}.`
        : `El video 1.2 ya existía con ID ${video.id}.`
    );
  } catch (error) {
    console.error('Error:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();