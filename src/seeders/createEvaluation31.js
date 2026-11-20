require('dotenv').config();

const {
  sequelize,
  Module,
  Evaluation,
  Question,
  Option,
} = require('../models');

const TITLE =
  'Evaluación — Tema 3.1: Inteligencia artificial aplicada a servicios urbanos';

const questions = [
  {
    text:
      '¿Cómo puede ayudar la inteligencia artificial a los servicios urbanos?',
    options: [
      'Analizando datos para identificar patrones y apoyar las decisiones.',
      'Eliminando la necesidad de personal municipal.',
      'Tomando decisiones sin conocer los problemas de la ciudad.',
      'Sustituyendo todos los servicios públicos.',
    ],
    correctIndex: 0,
  },
  {
    text:
      'Antes de implementar IA, ¿qué debe identificar la ciudad?',
    options: [
      'La aplicación más popular.',
      'Una necesidad urbana concreta y el resultado que espera conseguir.',
      'La mayor cantidad posible de cámaras.',
      'Un algoritmo, aunque no exista un problema definido.',
    ],
    correctIndex: 1,
  },
  {
    text:
      '¿Por qué son necesarios datos confiables y actualizados?',
    options: [
      'Porque permiten obtener resultados más útiles para analizar el problema.',
      'Porque evitan que el personal revise las recomendaciones.',
      'Porque garantizan que cualquier decisión de la IA será correcta.',
      'Porque hacen innecesaria la infraestructura tecnológica.',
    ],
    correctIndex: 0,
  },
  {
    text:
      'Según el guion, ¿para qué se aplica IA en el metro de Barcelona?',
    options: [
      'Para reemplazar a todos los pasajeros.',
      'Para optimizar la ventilación.',
      'Para construir nuevas estaciones automáticamente.',
      'Para eliminar los horarios del servicio.',
    ],
    correctIndex: 1,
  },
  {
    text:
      'Si la IA recomienda una acción, ¿quién debe validar el resultado y conservar la responsabilidad de la decisión?',
    options: [
      'El sistema de IA por sí solo.',
      'Los fabricantes de los sensores.',
      'El personal municipal responsable.',
      'Las cámaras instaladas en la ciudad.',
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

    for (const model of [
      Evaluation,
      Question,
      Option,
    ]) {
      await synchronizeIdSequence(model);
    }

    const evaluationId = await sequelize.transaction(
      async (transaction) => {
        const [evaluation] =
          await Evaluation.findOrCreate({
            where: {
              moduleId: mod.id,
              courseId: 1,
              title: TITLE,
            },
            defaults: {
              moduleId: mod.id,
              courseId: 1,
              title: TITLE,
              is_final: false,
            },
            transaction,
          });

        if (evaluation.is_final) {
          throw new Error(
            'La evaluación 3.1 no debe ser final.'
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
            const [option] =
              await Option.findOrCreate({
                where: {
                  questionId: question.id,
                  text: item.options[index],
                },
                defaults: {
                  questionId: question.id,
                  text: item.options[index],
                  is_correct:
                    index === item.correctIndex,
                },
                transaction,
              });

            await option.update(
              {
                is_correct:
                  index === item.correctIndex,
              },
              { transaction }
            );
          }
        }

        return evaluation.id;
      }
    );

    console.log(
      `Evaluación del tema 3.1 registrada con ID ${evaluationId}.`
    );

    console.log(
      'Cinco preguntas, dos puntos cada una. Respuestas: A, B, A, B, C.'
    );

    console.log(
      'Nota máxima: 10 puntos. Aprobación: al menos 4 respuestas correctas (80 %).'
    );
  } catch (error) {
    console.error(
      'Error registrando la evaluación 3.1:',
      error.message
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();