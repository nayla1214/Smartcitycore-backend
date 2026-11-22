const { Op } = require('sequelize');

const {
  sequelize,
  Evaluation,
  EvaluationActivity,
  EvaluationAttempt,
  UserCourse,
} = require('../models');

const EVALUATION_ID = 11;
const MODULE_ID = 1;
const COURSE_ID = 1;

const ACTIVITY_TYPES = [
  'true_false',
  'fill_blanks',
  'matching',
  'ordering',
  'case_study',
];

// Comprueba que la evaluación corresponde al módulo esperado.
const findModuleEvaluation = async () => {
  return Evaluation.findOne({
    where: {
      id: EVALUATION_ID,
      moduleId: MODULE_ID,
      courseId: COURSE_ID,
      is_final: false,
    },
  });
};

// Para realizar la integradora deben estar aprobados
// los cuatro temas del módulo 1.
const checkRequirements = async (userId) => {
  const evaluations = await Evaluation.findAll({
    where: {
      moduleId: MODULE_ID,
      courseId: COURSE_ID,
      is_final: false,
    },
    attributes: ['id', 'title'],
  });

  const requiredIds = [];

  for (const topic of ['1.1', '1.2', '1.3', '1.4']) {
    const escapedTopic = topic.replace('.', '\\.');

    const pattern = new RegExp(
      `\\btema\\s*${escapedTopic}\\b`,
      'i'
    );

    const matches = evaluations.filter((evaluation) =>
      pattern.test(evaluation.title)
    );

    if (matches.length !== 1) {
      throw new Error(
        `No se pudo identificar una única evaluación del tema ${topic}.`
      );
    }

    requiredIds.push(matches[0].id);
  }

  const attempts = await EvaluationAttempt.findAll({
    where: {
      userId,
      evaluationId: {
        [Op.in]: requiredIds,
      },
      passed: true,
    },
    attributes: ['evaluationId'],
  });

  const passedIds = new Set(
    attempts.map((attempt) => Number(attempt.evaluationId))
  );

  return requiredIds.every((id) =>
    passedIds.has(Number(id))
  );
};

const isObject = (value) => {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
};

const invalidAnswer = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

// Comprueba que se enviaron exactamente los elementos esperados.
const validateKeys = (answers, expectedIds) => {
  if (!isObject(answers)) {
    throw invalidAnswer(
      'El formato de una actividad no es válido.'
    );
  }

  const keys = Object.keys(answers);

  if (
    keys.length !== expectedIds.length ||
    !expectedIds.every((id) =>
      Object.prototype.hasOwnProperty.call(answers, id)
    )
  ) {
    throw invalidAnswer(
      'Debes responder todos los elementos de cada actividad.'
    );
  }
};

// Califica una actividad utilizando únicamente
// las soluciones almacenadas en el servidor.
const gradeActivity = (activity, answer) => {
  const config = activity.public_config;
  const solution = activity.solution;
  const maximumPoints = Number(activity.score);

  if (
    !isObject(config) ||
    !isObject(solution) ||
    !Number.isFinite(maximumPoints) ||
    maximumPoints <= 0 ||
    !ACTIVITY_TYPES.includes(activity.type)
  ) {
    throw new Error(
      `La actividad ${activity.id} está mal configurada.`
    );
  }

  const review = [];

  if (activity.type === 'ordering') {
    const items = config.items || [];
    const expectedOrder = solution.ordered_ids || [];
    const validIds = items.map((item) => item.id);

    if (
      validIds.length === 0 ||
      expectedOrder.length !== validIds.length ||
      new Set(expectedOrder).size !== validIds.length ||
      !expectedOrder.every((id) => validIds.includes(id))
    ) {
      throw new Error(
        `La actividad ${activity.id} tiene una secuencia inválida.`
      );
    }

    if (
      !Array.isArray(answer) ||
      answer.length !== validIds.length ||
      new Set(answer).size !== validIds.length ||
      !answer.every((id) => validIds.includes(id))
    ) {
      throw invalidAnswer(
        'Debes ordenar todos los pasos sin repetirlos.'
      );
    }

    const pointsPerItem = maximumPoints / validIds.length;

    for (let index = 0; index < expectedOrder.length; index++) {
      const correct = answer[index] === expectedOrder[index];

      review.push({
        position: index + 1,
        correct,
        selectedAnswer: answer[index],
        correctAnswer: expectedOrder[index],
        pointsEarned: correct ? pointsPerItem : 0,
        pointsPossible: pointsPerItem,
      });
    }
  } else {
    let items;

    switch (activity.type) {
      case 'true_false':
        items = config.statements;
        break;

      case 'fill_blanks':
        items = config.sentences;
        break;

      case 'matching':
        items = config.left_items;
        break;

      case 'case_study':
        items = config.questions;
        break;
    }

    if (
      !Array.isArray(items) ||
      items.length === 0 ||
      !isObject(solution.answers)
    ) {
      throw new Error(
        `La actividad ${activity.id} no tiene elementos válidos.`
      );
    }

    const expectedIds = items.map((item) => item.id);

    validateKeys(answer, expectedIds);
    validateKeys(solution.answers, expectedIds);

    const pointsPerItem = maximumPoints / items.length;

    for (const item of items) {
      const selected = answer[item.id];
      const expected = solution.answers[item.id];

      let allowedValues;

      if (activity.type === 'true_false') {
        allowedValues = [true, false];
      } else if (activity.type === 'fill_blanks') {
        allowedValues = (config.word_bank || []).map(
          (word) => word.id
        );
      } else if (activity.type === 'matching') {
        allowedValues = (config.right_items || []).map(
          (definition) => definition.id
        );
      } else {
        allowedValues = (item.options || []).map(
          (option) => option.id
        );
      }

      if (!allowedValues.includes(expected)) {
        throw new Error(
          `La actividad ${activity.id} tiene una solución inválida.`
        );
      }

      if (!allowedValues.includes(selected)) {
        throw invalidAnswer(
          'Una de las respuestas no pertenece a esta actividad.'
        );
      }

      const correct = selected === expected;

      review.push({
        itemId: item.id,
        correct,
        selectedAnswer: selected,
        correctAnswer: expected,
        pointsEarned: correct ? pointsPerItem : 0,
        pointsPossible: pointsPerItem,
      });
    }

    if (activity.type === 'matching') {
      const selectedValues = Object.values(answer);

      if (
        new Set(selectedValues).size !== selectedValues.length
      ) {
        throw invalidAnswer(
          'Cada definición debe relacionarse con un solo concepto.'
        );
      }
    }
  }

  const earnedPoints = review.reduce(
    (total, item) => total + item.pointsEarned,
    0
  );

  return {
    activityId: activity.id,
    title: activity.title,
    type: activity.type,
    pointsEarned: earnedPoints,
    pointsPossible: maximumPoints,
    items: review,
  };
};

// Cargar la evaluación sin revelar las soluciones.
const getModuleEvaluation = async (req, res) => {
  try {
    const evaluation = await findModuleEvaluation();

    if (!evaluation) {
      return res.status(404).json({
        message:
          'No se encontró la evaluación integradora del módulo 1.',
      });
    }

    const allowed = await checkRequirements(req.user.id);

    if (!allowed) {
      return res.status(403).json({
        message:
          'Primero debes aprobar los temas 1.1, 1.2, 1.3 y 1.4.',
      });
    }

    const activities = await EvaluationActivity.findAll({
      where: {
        evaluationId: evaluation.id,
      },

      // Selección explícita: nunca enviar solution.
      attributes: [
        'id',
        'activity_key',
        'type',
        'title',
        'instructions',
        'score',
        'order_number',
        'public_config',
      ],

      order: [['order_number', 'ASC']],
    });

    if (activities.length !== 5) {
      throw new Error(
        'La evaluación debe tener cinco actividades.'
      );
    }

    const passedAttempt = await EvaluationAttempt.findOne({
      where: {
        userId: req.user.id,
        evaluationId: evaluation.id,
        passed: true,
      },
      order: [['attempted_at', 'DESC']],
    });

    return res.status(200).json({
      id: evaluation.id,
      title: evaluation.title,
      moduleId: evaluation.moduleId,
      courseId: evaluation.courseId,
      maximumScore: activities.reduce(
        (total, activity) => total + Number(activity.score),
        0
      ),
      passingPercentage: 70,
      passed: Boolean(passedAttempt),
      percentage: passedAttempt?.score ?? null,
      activities,
    });
  } catch (error) {
    console.error(
      'Error al cargar la evaluación integradora:',
      error
    );

    return res.status(500).json({
      message:
          'No se pudo cargar la evaluación integradora.',
    });
  }
};

// Calificar las cinco actividades y guardar el intento.
const submitModuleEvaluation = async (req, res) => {
  try {
    const evaluation = await findModuleEvaluation();

    if (!evaluation) {
      return res.status(404).json({
        message: 'Evaluación integradora no encontrada.',
      });
    }

    const allowed = await checkRequirements(req.user.id);

    if (!allowed) {
      return res.status(403).json({
        message:
          'Primero debes aprobar los cuatro temas del módulo 1.',
      });
    }

    const activities =
      await EvaluationActivity.scope('withSolution').findAll({
        where: {
          evaluationId: evaluation.id,
        },
        order: [['order_number', 'ASC']],
      });

    if (activities.length !== 5) {
      throw new Error(
        'La evaluación debe tener cinco actividades.'
      );
    }

    // Formato:
    // answers: [
    //   { activityId: 1, answer: { vf1: false, ... } },
    //   { activityId: 2, answer: { completar1: "...", ... } },
    //   ...
    // ]
    const { answers } = req.body;

    if (
      !Array.isArray(answers) ||
      answers.length !== activities.length
    ) {
      throw invalidAnswer(
        'Debes completar las cinco actividades.'
      );
    }

    const answersByActivity = new Map();

    for (const entry of answers) {
      if (!isObject(entry)) {
        throw invalidAnswer(
          'El formato de las respuestas no es válido.'
        );
      }

      const activityId = entry.activityId;

      if (
        !Number.isInteger(activityId) ||
        answersByActivity.has(activityId)
      ) {
        throw invalidAnswer(
          'Hay actividades repetidas o identificadores inválidos.'
        );
      }

      answersByActivity.set(activityId, entry.answer);
    }

    if (
      !activities.every((activity) =>
        answersByActivity.has(activity.id)
      )
    ) {
      throw invalidAnswer(
        'Las respuestas no corresponden a esta evaluación.'
      );
    }

    const review = activities.map((activity) =>
      gradeActivity(
        activity,
        answersByActivity.get(activity.id)
      )
    );

    const earnedScore = review.reduce(
      (total, activity) => total + activity.pointsEarned,
      0
    );

    const maximumScore = review.reduce(
      (total, activity) => total + activity.pointsPossible,
      0
    );

    const rawPercentage =
      (earnedScore / maximumScore) * 100;

    // Se decide la aprobación antes de redondear.
    const passed = rawPercentage >= 70;
    const percentage = Number(rawPercentage.toFixed(2));

    const attempt = await sequelize.transaction(
      async (transaction) => {
        const savedAttempt = await EvaluationAttempt.create(
          {
            userId: req.user.id,
            evaluationId: evaluation.id,
            score: percentage,
            passed,
          },
          { transaction }
        );

        if (passed) {
          await UserCourse.findOrCreate({
            where: {
              userId: req.user.id,
              courseId: evaluation.courseId,
            },
            defaults: {
              userId: req.user.id,
              courseId: evaluation.courseId,
            },
            transaction,
          });
        }

        // Aprobar un módulo no finaliza el curso
        // ni genera un certificado.
        return savedAttempt;
      }
    );

    return res.status(200).json({
      attempt,
      passed,
      percentage,
      earnedScore: Number(earnedScore.toFixed(2)),
      maximumScore,
      review,
    });
  } catch (error) {
    console.error(
      'Error al calificar la evaluación integradora:',
      error
    );

    return res.status(error.statusCode || 500).json({
      message:
        error.statusCode === 400
          ? error.message
          : 'No se pudo guardar el resultado de la evaluación.',
    });
  }
};

module.exports = {
  getModuleEvaluation,
  submitModuleEvaluation,
};