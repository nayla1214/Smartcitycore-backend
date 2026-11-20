require('dotenv').config();

const {
  sequelize,
  Module,
  Evaluation,
  Question,
} = require('../models');

const PracticalSubmission = require(
  '../models/PracticalSubmission'
);

const TITLE =
  'Evaluación — Tema 2.3: Espacios urbanos (actividad práctica)';

async function main() {
  try {
    await sequelize.authenticate();

    const mod = await Module.findOne({
      where: {
        courseId: 1,
        order_number: 2,
      },
    });

    if (!mod) {
      throw new Error(
        'No existe el módulo 2 del curso 1.'
      );
    }

    const previousEvaluation = await Evaluation.findByPk(6);

    if (
      !previousEvaluation ||
      Number(previousEvaluation.moduleId) !== Number(mod.id)
    ) {
      throw new Error(
        'Revisa la evaluación 2.2: se esperaba el ID 6 en este módulo.'
      );
    }

    // Crea únicamente la tabla nueva si todavía no existe.
    await PracticalSubmission.sync();

    // Corrige el contador de IDs si hubo inserciones manuales.
    const table =
      sequelize.dialect.queryGenerator.quoteTable(
        Evaluation.getTableName()
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

    const [evaluation, created] =
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
      });

    const questionCount = await Question.count({
      where: {
        evaluationId: evaluation.id,
      },
    });

    if (evaluation.is_final || questionCount > 0) {
      throw new Error(
        'La evaluación práctica no debe ser final ni tener preguntas de opción múltiple.'
      );
    }

    console.log(
      `Evaluación práctica 2.3 ${
        created ? 'creada' : 'ya registrada'
      } con ID ${evaluation.id}.`
    );

    console.log(
      'Seis respuestas + una imagen válida = 10/10 puntos (100 %).'
    );

    console.log(
      'La aprobación se registra al guardar la entrega completa.'
    );
  } catch (error) {
    console.error(
      'Error registrando la evaluación 2.3:',
      error.message
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();