require('dotenv').config();

const {
  sequelize,
  Evaluation,
  Question,
  Option,
} = require('../models');

async function checkTopic11Evaluation() {
  try {
    await sequelize.authenticate();

    const evaluation = await Evaluation.findByPk(1, {
      include: [
        {
          model: Question,
          include: [Option],
        },
      ],
    });

    if (!evaluation) {
      console.log('No existe la evaluación con ID 1.');
      return;
    }

    console.log('ID:', evaluation.id);
    console.log('Título:', evaluation.title);
    console.log('Preguntas:', evaluation.Questions?.length ?? 0);

    for (const question of evaluation.Questions || []) {
      console.log(
        `- Pregunta ${question.id}: ${question.text}`
      );
      console.log(
        `  Opciones: ${question.Options?.length ?? 0}`
      );
    }
  } catch (error) {
    console.error('Error al consultar evaluación:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

checkTopic11Evaluation();