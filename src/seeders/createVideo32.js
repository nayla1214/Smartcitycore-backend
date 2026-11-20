require('dotenv').config();

const {
  sequelize,
  Module,
  Video,
} = require('../models');

const VIDEO_URL = '8ZI89AMbYM4';
const VIDEO_DURATION = 285;

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

    const mod = await Module.findOne({
      where: {
        courseId: 1,
        order_number: 3,
      },
    });

    if (!mod) {
      throw new Error(
        'No se encontró el módulo 3 del curso 1.'
      );
    }

    await synchronizeIdSequence(Video);

    const [video, created] =
      await Video.findOrCreate({
        where: {
          moduleId: mod.id,
          url: VIDEO_URL,
        },

        defaults: {
          moduleId: mod.id,
          title:
            'Tema 3.2: Educación inteligente',
          description:
            'Introducción a la educación inteligente, las plataformas digitales de aprendizaje y su contribución al desarrollo de capacidades en las ciudades.',
          url: VIDEO_URL,
          duration: VIDEO_DURATION,
          order_number: 2,
          status: true,
        },
      });

    if (
      Number(video.duration) !== VIDEO_DURATION
    ) {
      await video.update({
        duration: VIDEO_DURATION,
      });
    }

    console.log(
      created
        ? `Video 3.2 creado correctamente con ID ${video.id}.`
        : `El video 3.2 ya existía con ID ${video.id}.`
    );

    console.log(
      'Duración: 4 minutos y 45 segundos (285 segundos).'
    );

    console.log(
      `Módulo: ${mod.id}. Curso: ${mod.courseId}.`
    );

    console.log(
      `Ruta del tema: /module/${mod.id}/topic/3.2`
    );
  } catch (error) {
    console.error(
      'Error registrando el video 3.2:',
      error.message
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();