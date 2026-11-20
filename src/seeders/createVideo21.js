require('dotenv').config();

const {
  sequelize,
  Module,
  Video,
} = require('../models');

const COURSE_ID = 1;
const VIDEO_URL = 'Fiy6pRrVWnA';

async function synchronizeIdSequence(model) {
  const table = sequelize.dialect.queryGenerator.quoteTable(
    model.getTableName()
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

    const firstModule = await Module.findOne({
      where: {
        courseId: COURSE_ID,
        order_number: 1,
      },
    });

    if (!firstModule) {
      throw new Error(
        'No se encontró el módulo 1 del curso 1.'
      );
    }

    await synchronizeIdSequence(Module);
    await synchronizeIdSequence(Video);

    const result = await sequelize.transaction(
      async (transaction) => {
        const [module, moduleCreated] =
          await Module.findOrCreate({
            where: {
              courseId: COURSE_ID,
              order_number: 2,
            },
            defaults: {
              courseId: COURSE_ID,
              title:
                'Módulo 2: Infraestructura Sostenible y Movilidad',
              description:
                'Infraestructura verde, transporte sostenible y espacios urbanos para mejorar la calidad de vida.',
              order_number: 2,
              status: true,
            },
            transaction,
          });

        const [video, videoCreated] =
          await Video.findOrCreate({
            where: {
              moduleId: module.id,
              url: VIDEO_URL,
            },
            defaults: {
              moduleId: module.id,
              title: 'Tema 2.1: Infraestructura verde',
              description:
                'Infraestructura verde y su contribución a la sostenibilidad y la calidad de vida en las ciudades.',
              url: VIDEO_URL,
              duration: 392,
              order_number: 1,
              status: true,
            },
            transaction,
          });

        return {
          module,
          moduleCreated,
          video,
          videoCreated,
        };
      }
    );

    console.log(
      result.moduleCreated
        ? `Módulo 2 creado correctamente con ID ${result.module.id}.`
        : `El módulo 2 ya existía con ID ${result.module.id}.`
    );

    console.log(
      result.videoCreated
        ? `Video 2.1 creado correctamente con ID ${result.video.id}.`
        : `El video 2.1 ya existía con ID ${result.video.id}.`
    );

    console.log('Duración: 6 minutos y 32 segundos.');
    console.log(`Curso: ${COURSE_ID}.`);
  } catch (error) {
    console.error(
      'Error registrando el tema 2.1:',
      error.message
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();