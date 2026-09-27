const {
  Evaluation,
  Question,
  Option,
  EvaluationAttempt,
  UserCourse,
  Certificate,
} = require('../models');

// POST /api/evaluations — Solo ADMIN
const createEvaluation = async (req, res) => {
  try {
    const {
      moduleId,
      courseId,
      title,
      is_final,
      questions,
    } = req.body;

    const evaluation = await Evaluation.create({
      moduleId,
      courseId,
      title,
      is_final,
    });

    if (Array.isArray(questions)) {
      for (const item of questions) {
        const question = await Question.create({
          evaluationId: evaluation.id,
          text: item.text,
          score: item.score ?? 1,
        });

        if (Array.isArray(item.options)) {
          for (const option of item.options) {
            await Option.create({
              questionId: question.id,
              text: option.text,
              is_correct: Boolean(option.is_correct),
            });
          }
        }
      }
    }

    return res.status(201).json(evaluation);
  } catch (error) {
    console.error('Error al crear evaluación:', error);

    return res.status(500).json({
      message: 'Error al crear la evaluación.',
    });
  }
};

// GET /api/evaluations/:id — Preguntas sin respuestas correctas
const getEvaluation = async (req, res) => {
  try {
    const evaluationId = Number(req.params.id);

    if (!Number.isInteger(evaluationId) || evaluationId < 1) {
      return res.status(400).json({
        message: 'Identificador de evaluación inválido.',
      });
    }

    const evaluation = await Evaluation.findByPk(evaluationId, {
      include: [
        {
          model: Question,
          include: [
            {
              model: Option,
              attributes: ['id', 'text'],
            },
          ],
        },
      ],
    });

    if (!evaluation) {
      return res.status(404).json({
        message: 'Evaluación no encontrada.',
      });
    }

    return res.status(200).json(evaluation);
  } catch (error) {
    console.error('Error al cargar evaluación:', error);

    return res.status(500).json({
      message: 'No se pudo cargar la evaluación.',
    });
  }
};

// GET /api/evaluations/:id/progress
const getEvaluationProgress = async (req, res) => {
  try {
    const evaluationId = Number(req.params.id);

    if (!Number.isInteger(evaluationId) || evaluationId < 1) {
      return res.status(400).json({
        message: 'Identificador de evaluación inválido.',
      });
    }

    const evaluation = await Evaluation.findByPk(evaluationId);

    if (!evaluation) {
      return res.status(404).json({
        message: 'Evaluación no encontrada.',
      });
    }

    const passedAttempt = await EvaluationAttempt.findOne({
      where: {
        userId: req.user.id,
        evaluationId,
        passed: true,
      },
      order: [['attempted_at', 'DESC']],
    });

    return res.status(200).json({
      passed: Boolean(passedAttempt),
      percentage: passedAttempt?.score ?? null,
    });
  } catch (error) {
    console.error(
      'Error al consultar progreso de evaluación:',
      error
    );

    return res.status(500).json({
      message: 'No se pudo consultar el progreso de la evaluación.',
    });
  }
};

// POST /api/evaluations/:id/submit
const submitEvaluation = async (req, res) => {
  try {
    const evaluationId = Number(req.params.id);
    const { answers } = req.body;

    if (!Number.isInteger(evaluationId) || evaluationId < 1) {
      return res.status(400).json({
        message: 'Identificador de evaluación inválido.',
      });
    }

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        message: 'Debes enviar tus respuestas.',
      });
    }

    const evaluation = await Evaluation.findByPk(evaluationId, {
      include: [
        {
          model: Question,
          include: [Option],
        },
      ],
    });

    if (!evaluation) {
      return res.status(404).json({
        message: 'Evaluación no encontrada.',
      });
    }

    const questions = evaluation.Questions || [];

    if (questions.length === 0) {
      return res.status(400).json({
        message: 'Esta evaluación todavía no tiene preguntas.',
      });
    }

    if (answers.length !== questions.length) {
      return res.status(400).json({
        message: 'Debes responder todas las preguntas.',
      });
    }

    const selectedAnswers = new Map();

    for (const answer of answers) {
      const questionId = Number(answer.questionId);
      const optionId = Number(answer.optionId);

      if (
        !Number.isInteger(questionId) ||
        !Number.isInteger(optionId) ||
        selectedAnswers.has(questionId)
      ) {
        return res.status(400).json({
          message: 'Las respuestas enviadas no son válidas.',
        });
      }

      selectedAnswers.set(questionId, optionId);
    }

    let earnedScore = 0;
    let maximumScore = 0;

    // Se devuelve únicamente después de calificar.
    const review = [];

    for (const question of questions) {
      const weight = Number(question.score) || 1;
      maximumScore += weight;

      const optionId = selectedAnswers.get(question.id);

      if (!optionId) {
        return res.status(400).json({
          message: 'Debes responder todas las preguntas.',
        });
      }

      const options = question.Options || [];

      const selectedOption = options.find(
        (option) => option.id === optionId
      );

      if (!selectedOption) {
        return res.status(400).json({
          message: 'Una respuesta no corresponde a esta evaluación.',
        });
      }

      const correctOption = options.find(
        (option) => option.is_correct === true
      );

      if (!correctOption) {
        console.error(
          `La pregunta ${question.id} no tiene respuesta correcta.`
        );

        return res.status(500).json({
          message: 'La evaluación tiene una pregunta mal configurada.',
        });
      }

      const correct = selectedOption.is_correct === true;

      if (correct) {
        earnedScore += weight;
      }

      review.push({
        questionId: question.id,
        question: question.text,
        correct,
        selectedAnswer: selectedOption.text,
        correctAnswer: correctOption.text,
        pointsEarned: correct ? weight : 0,
        pointsPossible: weight,
      });
    }

    const percentage = (earnedScore / maximumScore) * 100;
    const passed = percentage >= 70;

    const attempt = await EvaluationAttempt.create({
      userId: req.user.id,
      evaluationId: evaluation.id,
      score: percentage,
      passed,
    });

    if (passed) {
      const courseId = evaluation.courseId;

      if (evaluation.is_final) {
        const [userCourse] = await UserCourse.findOrCreate({
          where: {
            userId: req.user.id,
            courseId,
          },
          defaults: {
            userId: req.user.id,
            courseId,
          },
        });

        await userCourse.update({
          is_completed: true,
          final_score: percentage,
        });

        await Certificate.findOrCreate({
          where: {
            userId: req.user.id,
            courseId,
          },
          defaults: {
            userId: req.user.id,
            courseId,
          },
        });
      } else {
        await UserCourse.findOrCreate({
          where: {
            userId: req.user.id,
            courseId,
          },
          defaults: {
            userId: req.user.id,
            courseId,
          },
        });
      }
    }

    return res.status(200).json({
      attempt,
      percentage,
      passed,
      earnedScore,
      maximumScore,
      review,
    });
  } catch (error) {
    console.error('Error al enviar evaluación:', error);

    return res.status(500).json({
      message: 'No se pudieron guardar los resultados. Intenta nuevamente.',
    });
  }
};

module.exports = {
  createEvaluation,
  getEvaluation,
  getEvaluationProgress,
  submitEvaluation,
};