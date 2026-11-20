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
  'Evaluación — Tema 2.2: Transporte sostenible';

const questions = [
  {
    text: '¿Qué busca mejorar el Smart Transport?',
    options: [
      'Únicamente la cantidad de estacionamientos.',
      'La movilidad mediante datos y tecnología, reduciendo congestión, accidentes y contaminación.',
      'Solo la velocidad de los automóviles particulares.',
      'La movilidad sin considerar a los pasajeros.',
    ],
    correctIndex: 1,
  },
  {
    text: 'Además de los datos y la tecnología, ¿qué elementos muestra la diapositiva como parte de un transporte inteligente?',
    options: [
      'Planificación y alternativas de movilidad.',
      'Publicidad y edificios nuevos.',
      'Más automóviles y menos rutas.',
      'Trámites y archivos municipales.',
    ],
    correctIndex: 0,
  },
  {
    text: '¿Qué demuestra el caso de SFpark mencionado en el guion?',
    options: [
      'Que una herramienta tecnológica puede ayudar a localizar estacionamientos disponibles.',
      'Que las bicicletas reemplazan a todos los autobuses.',
      'Que no es necesario informar sobre la movilidad.',
      'Que aumentar los estacionamientos siempre elimina la congestión.',
    ],
    correctIndex: 0,
  },
  {
    text: '¿Cuál de los siguientes ejemplos muestra el papel de la infraestructura en el transporte sostenible?',
    options: [
      'Publicar un mapa sin actualizar las rutas.',
      'Crear corredores exclusivos para autobuses, como en el sistema BRT de Curitiba.',
      'Medir el tráfico sin mejorar los servicios.',
      'Impedir el uso de alternativas al automóvil.',
    ],
    correctIndex: 1,
  },
  {
    text: '¿Qué indicador permitiría comprobar si una mejora del transporte público está dando resultados?',
    options: [
      'El color de los autobuses.',
      'La cantidad de anuncios de la campaña.',
      'El tiempo de viaje y la frecuencia del servicio.',
      'El número de oficinas de transporte.',
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
      EXISTS (SELECT 1 FROM ${table})
    );
  `);
}

async function main() {
  try {
    await sequelize.authenticate();

    const video = await Video.findOne({
      where: {
        url: 'BNz5AHsH1nA',
      },
    });

    if (!video) {
      throw new Error(
        'Primero registra el video del tema 2.2.'
      );
    }

    const module = await Module.findByPk(video.moduleId);

    if (
      !module ||
      Number(module.courseId) !== 1 ||
      Number(module.order_number) !== 2
    ) {
      throw new Error(
        'El video 2.2 debe pertenecer al módulo 2 del curso 1.'
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
            'La evaluación del tema 2.2 aparece como evaluación final.'
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
      `Evaluación del tema 2.2 registrada con ID ${evaluationId}.`
    );

    console.log(
      'Cinco preguntas, dos puntos cada una. Respuestas: B, A, A, B, C.'
    );

    console.log(
      'Nota máxima: 10 puntos. Aprobación desde 70 %: al menos 4 respuestas correctas (80 %).'
    );
  } catch (error) {
    console.error(
      'Error registrando la evaluación 2.2:',
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();