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

    // Ajustamos el contador para que PostgreSQL
    // asigne un ID libre al próximo video.
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
        url: '1u7iqnn2Saw',
      },
      defaults: {
        moduleId: module.id,
        title:
          'Tema 1.3: Evolución de las Ciudades Tradicionales a Ciudades Inteligentes',
        description:
          'Transformación de las ciudades mediante planificación, tecnología, datos y participación ciudadana.',
        url: '1u7iqnn2Saw',
        duration: 374,
        order_number: 3,
        status: true,
      },
    });

    console.log(
      created
        ? `Video 1.3 creado correctamente con ID ${video.id}.`
        : `El video 1.3 ya existía con ID ${video.id}.`
    );
  } catch (error) {
    console.error('Error:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();