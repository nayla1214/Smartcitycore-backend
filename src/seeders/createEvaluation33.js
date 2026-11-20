require('dotenv').config();

const {
  sequelize,
  Module,
  Evaluation,
  Question,
  Option,
} = require('../models');

const TITLE =
  'Evaluación — Tema 3.3: Gemelos digitales y simulación urbana';

const questions = [
  {
    text: '¿Qué es un gemelo digital urbano?',
    options: [
      'Un mapa impreso de la ciudad.',
      'Un modelo virtual de un elemento o sistema urbano alimentado con datos históricos y actuales.',
      'Una fotografía aérea que nunca se actualiza.',
      'Una aplicación para publicar noticias.',
    ],
    correctIndex: 1,
  },
  {
    text: '¿Qué permite hacer una simulación urbana dentro del gemelo digital?',
    options: [
      'Ensayar escenarios y observar sus posibles resultados antes de actuar en la ciudad real.',
      'Garantizar que cualquier cambio funcionará exactamente como se predijo.',
      'Sustituir todos los datos por opiniones.',
      'Evitar que se comparen alternativas.',
    ],
    correctIndex: 0,
  },
  {
    text: 'Según la diapositiva, ¿cuál es el orden correcto de funcionamiento?',
    options: [
      'Decidir → simular → capturar → actualizar → integrar.',
      'Capturar → integrar → actualizar → simular → decidir.',
      'Simular → decidir → integrar → capturar → actualizar.',
      'Actualizar → capturar → decidir → integrar → simular.',
    ],
    correctIndex: 1,
  },
  {
    text: '¿Cuál de estas situaciones podría estudiarse con un gemelo digital?',
    options: [
      'El efecto de una nueva ruta de transporte sobre los tiempos de viaje.',
      'El resultado exacto de todas las decisiones futuras.',
      'La opinión de la ciudadanía sin recopilar información.',
      'La eliminación de los riesgos de inundación sin intervenir en la ciudad.',
    ],
    correctIndex: 0,
  },
  {
    text: '¿Qué condición es importante para utilizar responsablemente un gemelo digital?',
    options: [
      'Tomar decisiones automáticas sin revisión.',
      'Trabajar con datos desactualizados para reducir costos.',
      'Contar con datos verificables, sistemas que compartan información y revisión humana de los resultados.',
      'Publicar toda la información recopilada, incluidos los datos personales.',
    ],
    correctIndex: 2,
  },
];

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
        order_number: 3,
      },
    });

    if (!module) {
      throw new Error(
        'No se encontró el módulo 3 del curso 1.'
      );
    }

    for (const model of [
      Evaluation,
      Question,
      Option,
    ]) {
      await synchronizeIdSequence(model);
    }

    const evaluationId =
      await sequelize.transaction(
        async (transaction) => {
          const [evaluation] =
            await Evaluation.findOrCreate({
              where: {
                moduleId: module.id,
                courseId: 1,
                title: TITLE,
              },
              defaults: {
                moduleId: module.id,
                courseId: 1,
                title: TITLE,
                is_final: false,
              },
              transaction,
            });

          if (evaluation.is_final) {
            throw new Error(
              'La evaluación del tema 3.3 no debe estar marcada como evaluación final del curso.'
            );
          }

          for (const item of questions) {
            const [question] =
              await Question.findOrCreate({
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

            await question.update(
              { score: 2 },
              { transaction }
            );

            for (
              let index = 0;
              index < item.options.length;
              index += 1
            ) {
              const text = item.options[index];
              const isCorrect =
                index === item.correctIndex;

              const [option] =
                await Option.findOrCreate({
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

              await option.update(
                {
                  is_correct: isCorrect,
                },
                { transaction }
              );
            }
          }

          return evaluation.id;
        }
      );

    console.log(
      `Evaluación del tema 3.3 registrada con ID ${evaluationId}.`
    );

    console.log(
      'Cinco preguntas, dos puntos cada una. Respuestas: B, A, B, A, C.'
    );

    console.log(
      'Nota máxima: 10 puntos. Aprobación desde 70 %: al menos 4 respuestas correctas (80 %).'
    );
  } catch (error) {
    console.error(
      'Error registrando la evaluación 3.3:',
      error.message
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();