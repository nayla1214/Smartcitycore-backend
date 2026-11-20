require('dotenv').config();

const {
  sequelize,
  Course,
  Module,
  Video,
} = require('../models');

const VIDEO_URL = 'NSfKRyRV1Hw';
const VIDEO_DURATION = 418;

// Ajusta las secuencias si anteriormente se insertaron
// registros con IDs manuales.
async function synchronizeIdSequence(model) {
  const table =
    sequelize.dialect.queryGenerator.quoteTable(
      model.getTableName()
    );

  await sequelize.query(`
    SELECT setval(
      pg_get_serial_sequence(
        ${sequelize.escape(table)},
        'id'
      ),
      GREATEST(
        COALESCE(
          (SELECT MAX("id") FROM ${table}),
          0
        ),
        1
      ),
      EXISTS (
        SELECT 1 FROM ${table}
      )
    );
  `);
}

async function main() {
  try {
    await sequelize.authenticate();

    const course = await Course.findByPk(1);

    if (!course) {
      throw new Error(
        'No existe el curso 1 en la base de datos.'
      );
    }

    await synchronizeIdSequence(Module);
    await synchronizeIdSequence(Video);

    const result = await sequelize.transaction(
      async (transaction) => {
        const [mod, moduleCreated] =
          await Module.findOrCreate({
            where: {
              courseId: course.id,
              order_number: 3,
            },

            defaults: {
              courseId: course.id,
              order_number: 3,
              title:
                'Inteligencia Artificial y Aplicaciones Urbanas',
              description:
                'Aplicaciones de inteligencia artificial en servicios urbanos, educación inteligente y gemelos digitales para apoyar la gestión de las ciudades.',
              status: true,
            },

            transaction,
          });

        const [video, videoCreated] =
          await Video.findOrCreate({
            where: {
              moduleId: mod.id,
              url: VIDEO_URL,
            },

            defaults: {
              moduleId: mod.id,
              title:
                'Tema 3.1: Inteligencia artificial aplicada a servicios urbanos',
              description:
                'Introducción al uso de inteligencia artificial para apoyar los servicios urbanos, considerando necesidades concretas, datos confiables e infraestructura adecuada.',
              url: VIDEO_URL,
              duration: VIDEO_DURATION,
              order_number: 1,
              status: true,
            },

            transaction,
          });

        // Si el video ya estaba registrado, asegura
        // que su duración sea la correcta.
        if (
          Number(video.duration) !== VIDEO_DURATION
        ) {
          await video.update(
            {
              duration: VIDEO_DURATION,
            },
            {
              transaction,
            }
          );
        }

        return {
          mod,
          moduleCreated,
          video,
          videoCreated,
        };
      }
    );

    console.log(
      result.moduleCreated
        ? `Módulo 3 creado correctamente con ID ${result.mod.id}.`
        : `El módulo 3 ya existía con ID ${result.mod.id}.`
    );

    console.log(
      result.videoCreated
        ? `Video 3.1 creado correctamente con ID ${result.video.id}.`
        : `El video 3.1 ya existía con ID ${result.video.id}.`
    );

    console.log(
      'Duración: 6 minutos y 58 segundos (418 segundos).'
    );

    console.log(
      `Módulo: ${result.mod.id}. Curso: ${course.id}.`
    );

    console.log(
      `Ruta del tema: /module/${result.mod.id}/topic/3.1`
    );
  } catch (error) {
    console.error(
      'Error registrando el video 3.1:',
      error.message
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();