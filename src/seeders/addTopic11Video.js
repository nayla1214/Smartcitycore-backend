require('dotenv').config();

const { sequelize, Course, Module, Video } = require('../models');

async function main() {
  try {
    await sequelize.authenticate();

    const [course] = await Course.findOrCreate({
      where: { id: 1 },
      defaults: {
        id: 1,
        name: 'Ciudades Inteligentes y Gobierno Digital',
        description: 'Curso de introducción a las ciudades inteligentes.',
        status: true
      }
    });

    const [module] = await Module.findOrCreate({
      where: { id: 1 },
      defaults: {
        id: 1,
        courseId: course.id,
        title: 'Módulo 1: Introducción a las ciudades inteligentes',
        description: 'Fundamentos de las ciudades inteligentes.',
        order_number: 1,
        status: true
      }
    });

    if (module.courseId !== course.id) {
      throw new Error('El módulo 1 pertenece a otro curso. No se modificó.');
    }

    const [video, created] = await Video.findOrCreate({
      where: { id: 1 },
      defaults: {
        id: 1,
        moduleId: module.id,
        title: 'Tema 1.1: Concepto de ciudad inteligente',
        description: 'Introducción al concepto de ciudad inteligente.',
        url: '2HS6SITpfOY',
        duration: 425,
        order_number: 1,
        status: true
      }
    });

    if (!created && video.moduleId !== module.id) {
      throw new Error('El video con ID 1 pertenece a otro módulo. No se modificó.');
    }

    console.log(
      `Curso ${course.id}, módulo ${module.id} y video ${video.id} registrados correctamente.`
    );
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

main();