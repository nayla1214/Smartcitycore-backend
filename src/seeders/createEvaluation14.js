require('dotenv').config();

const {
  sequelize,
  Module,
  Evaluation,
  Question,
  Option,
} = require('../models');

const TITLE =
  'Evaluación — Tema 1.4: Plataforma web de urbanismo inteligente';

const questions = [
  {
    text:
      '¿Qué tipo de información puede reunir una plataforma web de urbanismo inteligente?',
    options: [
      'Únicamente publicaciones de redes sociales.',
      'Datos de movilidad, ambiente, servicios públicos y territorio.',
      'Solo los nombres de los funcionarios municipales.',
      'Exclusivamente información turística.',
    ],
    correctIndex: 1,
  },
  {
    text:
      'Según la diapositiva, ¿qué debe hacer el municipio después de recopilar los datos y antes de integrarlos?',
    options: [
      'Eliminar los reportes ciudadanos.',
      'Publicar todos los datos personales.',
      'Validar la ubicación, la fecha y la confiabilidad de los datos.',
      'Cerrar el caso sin revisarlo.',
    ],
    correctIndex: 2,
  },
  {
    text:
      'Varios ciudadanos reportan inundaciones en un mismo sector. ¿Cómo puede ayudar la plataforma?',
    options: [
      'Identificando el sector afectado para priorizar y coordinar una respuesta.',
      'Sustituyendo por completo el trabajo de las áreas municipales.',
      'Ocultando los reportes para evitar nuevas consultas.',
      'Atendiendo primero los reportes sin considerar su ubicación.',
    ],
    correctIndex: 0,
  },
  {
    text:
      '¿Qué necesita una plataforma para que su información sea útil y segura?',
    options: [
      'Datos actualizados, sistemas que puedan intercambiar información y protección de los datos personales.',
      'Datos aislados que cada área municipal mantenga sin compartir.',
      'Publicar cualquier información sin comprobarla.',
      'Impedir que la ciudadanía consulte el estado de sus reportes.',
    ],
    correctIndex: 0,
  },
  {
    text:
      '¿Quiénes deben colaborar para que la plataforma contribuya a mejorar la ciudad?',
    options: [
      'Solo el área de tecnología del municipio.',
      'Únicamente las empresas privadas.',
      'El municipio, la ciudadanía, las universidades, las empresas y las organizaciones sociales.',
      'Solo quienes presentan reportes en línea.',
    ],
    correctIndex: 2,
  },
];

// Sincroniza las secuencias de PostgreSQL si se insertaron IDs manualmente.
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
            'La evaluación 1.4 aparece como evaluación final.'
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
            index++
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
      `Evaluación del tema 1.4 registrada con ID ${evaluationId}.`
    );

    console.log(
      'Cinco preguntas, dos puntos cada una. Respuestas: B, C, A, A, C.'
    );

    console.log(
      'Nota máxima: 10 puntos. Aprobación desde 70 %: al menos 4 respuestas correctas (80 %).'
    );
  } catch (error) {
    console.error(
      'Error registrando la evaluación 1.4:',
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();