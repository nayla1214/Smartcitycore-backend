require('dotenv').config();

const {
  sequelize,
  Course,
  Module,
  Topic,
} = require('../models');

const TOPICS_BY_MODULE = {
  1: [
    'Concepto de Ciudad Inteligente',
    'Gobernanza Inteligente y Ciudadanía Digital',
    'Evolución de las Ciudades Tradicionales a Ciudades Inteligentes',
    'Plataforma web de urbanismo inteligente',
  ],

  2: [
    'Infraestructura Verde (Smart Environment)',
    'Transporte Sostenible (Smart Transport)',
    'Espacios Urbanos (Smart Living)',
  ],

  3: [
    'Inteligencia Artificial aplicada a los Servicios Urbanos',
    'Educación Inteligente (Smart Education)',
    'Gemelos Digitales y Simulación Urbana',
  ],
};

const main = async () => {
  try {
    await sequelize.authenticate();

    const course = await Course.findByPk(1);

    if (!course) {
      throw new Error(
        'No existe el curso original con ID 1.'
      );
    }

    const modules = await Module.findAll({
      where: {
        courseId: course.id,
      },
      order: [['order_number', 'ASC']],
    });

    const originalModules = {};

    for (const order of [1, 2, 3]) {
      const matches = modules.filter(
        (moduleItem) =>
          Number(moduleItem.order_number) === order
      );

      if (matches.length !== 1) {
        throw new Error(
          `Debe existir exactamente un módulo con número ${order} en el curso 1.`
        );
      }

      originalModules[order] = matches[0];
    }

    // Crea únicamente la tabla nueva si todavía no existe.
    await Topic.sync();

    let createdCount = 0;
    let existingCount = 0;

    await sequelize.transaction(async (transaction) => {
      for (const order of [1, 2, 3]) {
        const moduleItem = originalModules[order];
        const titles = TOPICS_BY_MODULE[order];

        for (let index = 0; index < titles.length; index += 1) {
          const topicNumber = `${order}.${index + 1}`;

          const [, created] = await Topic.findOrCreate({
            where: {
              moduleId: moduleItem.id,
              topicNumber,
            },

            defaults: {
              moduleId: moduleItem.id,
              topicNumber,
              title: titles[index],
              introduction: '',
              order_number: index + 1,
            },

            transaction,
          });

          if (created) {
            createdCount += 1;
          } else {
            existingCount += 1;
          }
        }
      }
    });

    console.log(
      `Temas creados: ${createdCount}.`
    );

    console.log(
      `Temas existentes conservados: ${existingCount}.`
    );

    console.log(
      'Los videos, evaluaciones y avances existentes se conservaron.'
    );
  } catch (error) {
    console.error(
      'No se pudieron registrar los temas:',
      error.message
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

main();