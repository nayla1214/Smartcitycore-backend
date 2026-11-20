require('dotenv').config();

const {
  sequelize,
  Module,
  Video,
} = require('../models');

const VIDEO_URL = 'mUOt_GcwS0E';

async function synchronizeVideoSequence() {
  const table = sequelize.dialect.queryGenerator.quoteTable(
    Video.getTableName()
  );

  await sequelize.query(`
    SELECT setval(
      pg_get_serial_sequence(${sequelize.escape(table)}, 'id'),
      GREATEST(
        COALESCE((SELECT MAX("id") FROM ${table}), 0),
        1
      ),
      EXISTS (SELECT 1 FROM ${table})
    );
  `);
}

async function main() {
  try {
    await sequelize.authenticate();

    const module = await Module.findOne({
      where: {
        courseId: 1,
        order_number: 2,
      },
    });

    if (!module) {
      throw new Error(
        'No se encontró el módulo 2 del curso 1.'
      );
    }

    await synchronizeVideoSequence();

    const [video, created] = await Video.findOrCreate({
      where: {
        moduleId: module.id,
        url: VIDEO_URL,
      },
      defaults: {
        moduleId: module.id,
        title: 'Tema 2.3: Espacios urbanos',
        description:
          'Espacios urbanos accesibles, seguros, sostenibles e inclusivos para mejorar la calidad de vida y promover la participación de la comunidad.',
        url: VIDEO_URL,
        duration: 401,
        order_number: 3,
        status: true,
      },
    });

    console.log(
      created
        ? `Video 2.3 creado correctamente con ID ${video.id}.`
        : `El video 2.3 ya existía con ID ${video.id}.`
    );

    console.log('Duración: 6 minutos y 41 segundos.');

    console.log(
      `Módulo: ${module.id}. Curso: ${module.courseId}.`
    );
  } catch (error) {
    console.error(
      'Error registrando el video 2.3:',
      error.message
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();