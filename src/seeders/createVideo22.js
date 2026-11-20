require('dotenv').config();

const {
  sequelize,
  Module,
  Video,
} = require('../models');

const VIDEO_URL = 'BNz5AHsH1nA';

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
        title: 'Tema 2.2: Transporte sostenible',
        description:
          'Transporte sostenible y su contribución a una movilidad urbana más eficiente, accesible y respetuosa con el ambiente.',
        url: VIDEO_URL,
        duration: 402,
        order_number: 2,
        status: true,
      },
    });

    console.log(
      created
        ? `Video 2.2 creado correctamente con ID ${video.id}.`
        : `El video 2.2 ya existía con ID ${video.id}.`
    );

    console.log('Duración: 6 minutos y 42 segundos.');
    console.log(
      `Módulo: ${module.id}. Curso: ${module.courseId}.`
    );
  } catch (error) {
    console.error(
      'Error registrando el video 2.2:',
      error.message
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();