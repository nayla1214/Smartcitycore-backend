require('dotenv').config();

const {
  sequelize,
  Module,
  Video,
  Evaluation,
  Question,
  Option,
} = require('../models');

const TITLE =
  'Evaluación — Tema 2.1: Infraestructura verde';

const questions = [
  {
    text: '¿Cuál de los siguientes elementos forma parte de la infraestructura verde?',
    options: [
      'Un estacionamiento de concreto.',
      'Un techo verde.',
      'Una pantalla publicitaria.',
      'Un edificio de oficinas.',
    ],
    correctIndex: 1,
  },
  {
    text: 'Una zona se inunda con frecuencia porque el agua de lluvia no se infiltra. ¿Qué solución presentada en la diapositiva responde a ese problema?',
    options: [
      'Jardines de lluvia y pavimentos permeables.',
      'Más superficies impermeables.',
      'Pantallas para mostrar el pronóstico del tiempo.',
      'Únicamente nuevas señales de tránsito.',
    ],
    correctIndex: 0,
  },
  {
    text: '¿Qué pueden aportar los árboles urbanos y los techos verdes en una zona con temperaturas altas?',
    options: [
      'Más calor durante el día.',
      'Sombra y reducción del calor.',
      'La eliminación de todas las lluvias.',
      'Un aumento de superficies sin vegetación.',
    ],
    correctIndex: 1,
  },
  {
    text: 'Según el guion, ¿qué debe hacerse primero para aplicar infraestructura verde en una ciudad?',
    options: [
      'Elegir una solución sin conocer el lugar.',
      'Identificar los principales problemas ambientales del lugar.',
      'Construir el mismo tipo de parque en todos los barrios.',
      'Evaluar los resultados antes de realizar la intervención.',
    ],
    correctIndex: 1,
  },
  {
    text: '¿Cómo puede comprobarse si una intervención de infraestructura verde está funcionando?',
    options: [
      'Contando únicamente cuántas fotografías se publican del lugar.',
      'Midiendo aspectos relacionados con el problema atendido, como inundaciones, temperatura o calidad del agua.',
      'Esperando a que la vegetación crezca sin hacer seguimiento.',
      'Considerando solo el costo de construcción.',
    ],
    correctIndex: 1,
  },
];

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

    // Identificamos el módulo mediante el video real del tema.
    const video = await Video.findOne({
      where: {
        url: 'Fiy6pRrVWnA',
      },
    });

    if (!video) {
      throw new Error(
        'Primero registra el video del tema 2.1.'
      );
    }

    const module = await Module.findByPk(video.moduleId);

    if (
      !module ||
      Number(module.courseId) !== 1 ||
      Number(module.order_number) !== 2
    ) {
      throw new Error(
        'El video 2.1 debe pertenecer al módulo 2 del curso 1.'
      );
    }

    await synchronizeIdSequence(Evaluation);
    await synchronizeIdSequence(Question);
    await synchronizeIdSequence(Option);

    const evaluationId = await sequelize.transaction(
      async (transaction) => {
        const [evaluation] = await Evaluation.findOrCreate({
          where: {
            moduleId: module.id,
            courseId: module.courseId,
            title: TITLE,
          },
          defaults: {
            moduleId: module.id,
            courseId: module.courseId,
            title: TITLE,
            is_final: false,
          },
          transaction,
        });

        if (evaluation.is_final) {
          throw new Error(
            'La evaluación del tema 2.1 aparece como evaluación final.'
          );
        }

        for (const item of questions) {
          const [question] = await Question.findOrCreate({
            where: {
              evaluationId: evaluation.id,
              text: item.text,
            },
            defaults: {
              evaluationId: evaluation.id,
              text: item.text,
              score: 2,
            },
            transaction,
          });

          if (Number(question.score) !== 2) {
            await question.update(
              { score: 2 },
              { transaction }
            );
          }

          for (
            let index = 0;
            index < item.options.length;
            index += 1
          ) {
            const text = item.options[index];
            const isCorrect = index === item.correctIndex;

            const [option] = await Option.findOrCreate({
              where: {
                questionId: question.id,
                text,
              },
              defaults: {
                questionId: question.id,
                text,
                is_correct: isCorrect,
              },
              transaction,
            });

            if (option.is_correct !== isCorrect) {
              await option.update(
                { is_correct: isCorrect },
                { transaction }
              );
            }
          }
        }

        return evaluation.id;
      }
    );

    console.log(
      `Evaluación del tema 2.1 registrada con ID ${evaluationId}.`
    );

    console.log(
      'Cinco preguntas, dos puntos cada una. Respuestas: B, A, B, B, B.'
    );

    console.log(
      'Nota máxima: 10 puntos. Aprobación desde 70 %: al menos 4 respuestas correctas (80 %).'
    );
  } catch (error) {
    console.error(
      'Error registrando la evaluación 2.1:',
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();