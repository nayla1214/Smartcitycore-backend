require('dotenv').config();

const {
  sequelize,
  Module,
  Evaluation,
  Question,
  Option,
} = require('../models');

const TITLE =
  'Evaluación — Tema 1.2: Gobernanza inteligente y ciudadanía digital';

const questions = [
  {
    text: '¿Cuál es la finalidad de la gobernanza inteligente?',
    options: [
      'Sustituir todas las decisiones municipales por sistemas automáticos.',
      'Mejorar las decisiones y los servicios públicos mediante tecnología, datos y participación ciudadana.',
      'Ofrecer servicios únicamente por internet.',
      'Reducir la comunicación entre autoridades y ciudadanos.',
    ],
    correctIndex: 1,
  },
  {
    text: 'Según lo mencionado, ¿cuáles son los tres principios del gobierno abierto?',
    options: [
      'Movilidad, sostenibilidad y tecnología.',
      'Seguridad, conectividad y transporte.',
      'Transparencia, participación y colaboración.',
      'Educación, economía y turismo.',
    ],
    correctIndex: 2,
  },
  {
    text: '¿Cuál de estas acciones es un ejemplo de ciudadanía digital?',
    options: [
      'Reportar un problema del barrio mediante una plataforma municipal.',
      'Esperar a que el municipio detecte todos los problemas.',
      'Evitar consultar la información pública.',
      'Participar solo en reuniones presenciales.',
    ],
    correctIndex: 0,
  },
  {
    text: '¿Qué se necesita para que la participación digital sea inclusiva?',
    options: [
      'Publicar más servicios sin explicar cómo se usan.',
      'Garantizar acceso a internet y formación en habilidades digitales.',
      'Permitir el acceso únicamente a quienes ya dominan la tecnología.',
      'Reemplazar todos los espacios de atención ciudadana.',
    ],
    correctIndex: 1,
  },
  {
    text: '¿Cuál fue la ciudad latinoamericana mejor ubicada en el Cities in Motion Index 2025?',
    options: [
      'Montevideo.',
      'São Paulo.',
      'Buenos Aires.',
      'Santiago.',
    ],
    correctIndex: 3,
  },
];

// Corrige secuencias desactualizadas tras haber insertado IDs manualmente.
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
    )
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
    });

    if (evaluation.is_final) {
      throw new Error(
        'La evaluación 1.2 aparece como evaluación final.'
      );
    }

    await synchronizeIdSequence(Question);
    await synchronizeIdSequence(Option);

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
      });

      if (Number(question.score) !== 2) {
        await question.update({ score: 2 });
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
        });

        if (option.is_correct !== isCorrect) {
          await option.update({
            is_correct: isCorrect,
          });
        }
      }
    }

    console.log(
      `Evaluación del tema 1.2 registrada con ID ${evaluation.id}.`
    );
    console.log(
      'Cinco preguntas, dos puntos cada una. Respuestas: B, C, A, B, D.'
    );
  } catch (error) {
    console.error(
      'Error registrando la evaluación 1.2:',
      error
    );
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();