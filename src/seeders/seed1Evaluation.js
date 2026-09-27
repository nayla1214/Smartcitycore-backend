require('dotenv').config();

const {
  sequelize,
  Course,
  Module,
  Evaluation,
  Question,
  Option,
} = require('../models');

const TITLE = 'Evaluación — Tema 1.1: Concepto de Ciudad Inteligente';

const questions = [
  {
    text: '¿Qué caracteriza a una ciudad inteligente?',
    score: 2,
    options: [
      { text: 'Tener muchos edificios modernos.', is_correct: false },
      {
        text: 'Combinar tecnología, información, planificación y participación para mejorar la calidad de vida.',
        is_correct: true,
      },
      { text: 'Instalar sensores en todas las calles.', is_correct: false },
    ],
  },
  {
    text: '¿Qué debe hacer el municipio después de recibir reportes sobre una calle dañada?',
    score: 2,
    options: [
      {
        text: 'Analizar los reportes y priorizar la reparación.',
        is_correct: true,
      },
      { text: 'Esperar a que aumenten las quejas.', is_correct: false },
      {
        text: 'Publicar los reportes sin tomar decisiones.',
        is_correct: false,
      },
    ],
  },
  {
    text: '¿Para qué sirven los indicadores de desempeño?',
    score: 2,
    options: [
      {
        text: 'Para contar cuántas aplicaciones tiene la ciudad.',
        is_correct: false,
      },
      {
        text: 'Para medir resultados y detectar oportunidades de mejora.',
        is_correct: true,
      },
      {
        text: 'Para evitar que la ciudadanía participe.',
        is_correct: false,
      },
    ],
  },
  {
    text: '¿Cuál es un ejemplo de participación ciudadana?',
    score: 2,
    options: [
      {
        text: 'Los habitantes reportan problemas y proponen soluciones.',
        is_correct: true,
      },
      {
        text: 'El municipio decide sin consultar a nadie.',
        is_correct: false,
      },
      {
        text: 'La ciudadanía solo recibe información.',
        is_correct: false,
      },
    ],
  },
  {
    text: '¿Qué indicador mostraría una mejora en el transporte de Bogotá?',
    score: 2,
    options: [
      {
        text: 'El número de presentaciones del proyecto.',
        is_correct: false,
      },
      {
        text: 'El precio de la tecnología utilizada.',
        is_correct: false,
      },
      {
        text: 'La reducción del tiempo promedio de viaje.',
        is_correct: true,
      },
    ],
  },
];

async function seed1Evaluation() {
  try {
    await sequelize.authenticate();

    const course = await Course.findByPk(1);
    const module = await Module.findByPk(1);

    if (!course || !module || Number(module.courseId) !== Number(course.id)) {
      throw new Error(
        'Primero deben existir el curso 1 y el módulo 1 en la base de datos.'
      );
    }

    const evaluationId = await sequelize.transaction(async (transaction) => {
      let evaluation = await Evaluation.findOne({
        where: {
          courseId: course.id,
          moduleId: module.id,
          title: TITLE,
          is_final: false,
        },
        transaction,
      });

      if (!evaluation) {
        evaluation = await Evaluation.create(
          {
            courseId: course.id,
            moduleId: module.id,
            title: TITLE,
            is_final: false,
          },
          { transaction }
        );
      }

      const existingQuestions = await Question.count({
        where: { evaluationId: evaluation.id },
        transaction,
      });

      if (existingQuestions > 0) {
        if (existingQuestions !== questions.length) {
          throw new Error(
            `La evaluación ${evaluation.id} ya tiene ${existingQuestions} preguntas. ` +
            'No se modificó para evitar borrar contenido existente.'
          );
        }

        console.log(
          `La evaluación ${evaluation.id} ya tiene cinco preguntas. No se duplicaron.`
        );

        return evaluation.id;
      }

      for (const item of questions) {
        const question = await Question.create(
          {
            evaluationId: evaluation.id,
            text: item.text,
            score: item.score,
          },
          { transaction }
        );

        for (const option of item.options) {
          await Option.create(
            {
              questionId: question.id,
              text: option.text,
              is_correct: option.is_correct,
            },
            { transaction }
          );
        }
      }

      return evaluation.id;
    });

    console.log('Evaluación del tema 1.1 creada correctamente.');
    console.log(`ID de la evaluación: ${evaluationId}`);
    console.log('Preguntas: 5 · Valor: 2 puntos cada una · Total: 10 puntos');
  } catch (error) {
    console.error('No se pudo crear la evaluación:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

seed1Evaluation();