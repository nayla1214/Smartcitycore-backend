require('dotenv').config();

const {
  sequelize,
  Module,
  Evaluation,
  Question,
  Option,
} = require('../models');

const TITLE =
  'Evaluación — Tema 1.3: Evolución de las Ciudades Tradicionales a Ciudades Inteligentes';

const questions = [
  {
    text:
      'En la ciudad tradicional descrita en el video, ¿cómo se realizan los trámites?',
    options: [
      'Mediante sensores conectados.',
      'De forma manual.',
      'Con análisis de datos en tiempo real.',
      'Mediante realidad aumentada.',
    ],
    correctIndex: 1,
  },
  {
    text: '¿Qué caracteriza a la ciudad digital?',
    options: [
      'Incorpora computadoras, páginas web, bases de datos y trámites electrónicos.',
      'Predice automáticamente todos los problemas urbanos.',
      'Prescinde de la información municipal.',
      'Utiliza únicamente trámites manuales.',
    ],
    correctIndex: 0,
  },
  {
    text:
      '¿Qué distingue a una ciudad conectada de una ciudad digital?',
    options: [
      'La eliminación de los servicios públicos.',
      'El uso de dispositivos y sensores para compartir información y monitorear servicios en tiempo real.',
      'El regreso a los registros en papel.',
      'La publicación de guías impresas.',
    ],
    correctIndex: 1,
  },
  {
    text:
      'Según la diapositiva «Del dato aislado a una decisión útil», ¿cuál es la secuencia correcta?',
    options: [
      'Actuar → observar → comprender → registrar.',
      'Registrar → actuar → observar → comprender.',
      'Observar → registrar → comprender → actuar.',
      'Comprender → actuar → registrar → observar.',
    ],
    correctIndex: 2,
  },
  {
    text:
      '¿Cuándo puede considerarse realmente inteligente una solución urbana?',
    options: [
      'Cuando utiliza la tecnología más reciente, aunque no resuelva un problema.',
      'Cuando recopila datos, aunque nadie los utilice.',
      'Cuando responde a un problema real, apoya decisiones, permite medir resultados y considera a las personas.',
      'Cuando digitaliza un trámite sin evaluar si mejora la atención.',
    ],
    correctIndex: 2,
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
      true
    );
  `);
}

async function main() {
  try {
    await sequelize.authenticate();

    const module = await Module.findByPk(1);

    if (!module || Number(module.courseId) !== 1) {
      throw new Error(
        'No se encontró el módulo 1 del curso 1.'
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
            'La evaluación 1.3 aparece como evaluación final.'
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

          for (let index = 0; index < item.options.length; index++) {
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
      `Evaluación del tema 1.3 registrada con ID ${evaluationId}.`
    );
    console.log(
      'Cinco preguntas, dos puntos cada una. Respuestas: B, A, B, C, C.'
    );
    console.log(
      'Nota máxima: 10 puntos. Aprobación desde 70 %: al menos 4 respuestas correctas.'
    );
  } catch (error) {
    console.error(
      'Error registrando la evaluación 1.3:',
      error
    );
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();