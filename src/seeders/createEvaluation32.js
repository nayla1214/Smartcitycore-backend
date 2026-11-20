require('dotenv').config();

const {
  sequelize,
  Module,
  Evaluation,
  Question,
  Option,
} = require('../models');

const TITLE =
  'Evaluación — Tema 3.2: Educación inteligente';

const questions = [
  {
    text:
      '¿Qué busca ofrecer la educación inteligente o Smart Education?',
    options: [
      'Un mismo horario y lugar obligatorios para todos.',
      'Aprendizaje más flexible, accesible y organizado mediante recursos digitales y datos.',
      'Evaluaciones sin contenidos de aprendizaje.',
      'La eliminación del acompañamiento docente.',
    ],
    correctIndex: 1,
  },
  {
    text:
      'Según el guion, ¿qué papel cumple el docente en la educación inteligente?',
    options: [
      'Es reemplazado por completo por la plataforma.',
      'Solo administra las cuentas de acceso.',
      'Orienta y acompaña el aprendizaje, apoyándose en las herramientas digitales.',
      'Deja de revisar los resultados de los estudiantes.',
    ],
    correctIndex: 2,
  },
  {
    text: '¿Qué permite organizar un LMS?',
    options: [
      'Cursos, módulos, contenidos, actividades, evaluaciones y progreso.',
      'Únicamente la conexión a internet.',
      'Solo los datos de los servidores.',
      'Exclusivamente las clases presenciales.',
    ],
    correctIndex: 0,
  },
  {
    text:
      '¿Cuál es un paso necesario antes de implementar una plataforma educativa?',
    options: [
      'Publicar cursos sin consultar a sus usuarios.',
      'Identificar las necesidades de estudiantes y docentes.',
      'Evaluar resultados antes de ofrecer contenidos.',
      'Evitar la capacitación de los participantes.',
    ],
    correctIndex: 1,
  },
  {
    text:
      '¿Por qué es importante la educación para una ciudad inteligente, según el guion?',
    options: [
      'Porque sustituye todos los servicios urbanos.',
      'Porque impide que cambien las necesidades laborales.',
      'Porque desarrolla capacidades y conocimientos que pueden ayudar a resolver problemas urbanos.',
      'Porque hace innecesaria la participación ciudadana.',
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
            'La evaluación 3.2 no debe ser final.'
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
      `Evaluación del tema 3.2 registrada con ID ${evaluationId}.`
    );

    console.log(
      'Cinco preguntas, dos puntos cada una. Respuestas: B, C, A, B, C.'
    );

    console.log(
      'Nota máxima: 10 puntos. Aprobación: al menos 4 respuestas correctas (80 %).'
    );
  } catch (error) {
    console.error(
      'Error registrando la evaluación 3.2:',
      error.message
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();