const { Op } = require('sequelize');

const {
  sequelize,
  Evaluation,
  EvaluationActivity,
  EvaluationAttempt,
  UserCourse,
} = require('../models');

const EVALUATION_ID = 12;
const MODULE_ID = 2;
const COURSE_ID = 1;

const PUBLIC_FIELDS = [
  'id',
  'activity_key',
  'type',
  'title',
  'instructions',
  'score',
  'order_number',
  'public_config',
];

const fail = (status, message) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};

const isObject = (value) =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value);

const validateKeys = (value, ids) => {
  if (
    !isObject(value) ||
    Object.keys(value).length !== ids.length ||
    !ids.every((id) =>
      Object.prototype.hasOwnProperty.call(value, id)
    )
  ) {
    fail(
      400,
      'Debes responder todos los elementos de cada actividad.'
    );
  }
};

// Comprueba la evaluación y los tres temas aprobados.
// La actividad práctica del 2.3 también guarda un EvaluationAttempt.
const getContext = async (userId) => {
  const evaluation = await Evaluation.findOne({
    where: {
      id: EVALUATION_ID,
      moduleId: MODULE_ID,
      courseId: COURSE_ID,
      is_final: false,
    },
  });

  if (!evaluation) {
    fail(
      404,
      'No se encontró la integradora del módulo 2.'
    );
  }

  const evaluations = await Evaluation.findAll({
    where: {
      moduleId: MODULE_ID,
      courseId: COURSE_ID,
      is_final: false,
    },
    attributes: ['id', 'title'],
  });

  const requiredIds = ['2.1', '2.2', '2.3'].map(
    (topic) => {
      const pattern = new RegExp(
        `\\btema\\s*${topic.replace('.', '\\.')}\\b`,
        'i'
      );

      const matches = evaluations.filter((item) =>
        pattern.test(item.title)
      );

      if (matches.length !== 1) {
        fail(
          500,
          `No se pudo identificar una única evaluación del tema ${topic}.`
        );
      }

      return Number(matches[0].id);
    }
  );

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
    attempts.map((item) => Number(item.evaluationId))
  );

  if (!requiredIds.every((id) => passedIds.has(id))) {
    fail(
      403,
      'Primero debes aprobar los temas 2.1, 2.2 y la actividad práctica del tema 2.3.'
    );
  }

  return evaluation;
};

const validateActivities = (activities) => {
  const allowedTypes = [
    'true_false',
    'fill_blanks',
    'case_study',
  ];

  if (
    activities.length !== 5 ||
    activities.some(
      (item) =>
        !allowedTypes.includes(item.type) ||
        Number(item.score) !== 2
    )
  ) {
    fail(
      500,
      'La integradora debe tener cinco actividades de 2 puntos.'
    );
  }
};

const gradeActivity = (activity, answer) => {
  const config = activity.public_config;
  const solution = activity.solution;
  const score = Number(activity.score);

  if (
    !isObject(config) ||
    !isObject(solution) ||
    !isObject(solution.answers)
  ) {
    fail(500, 'Una actividad está mal configurada.');
  }

  const items =
    activity.type === 'true_false'
      ? config.statements
      : activity.type === 'fill_blanks'
        ? config.sentences
        : config.questions;

  if (
    !Array.isArray(items) ||
    !items.length ||
    items.some(
      (item) => !item || typeof item.id !== 'string'
    ) ||
    new Set(items.map((item) => item.id)).size !==
      items.length
  ) {
    fail(
      500,
      'Una actividad no tiene elementos válidos.'
    );
  }

  const ids = items.map((item) => item.id);

  if (
    Object.keys(solution.answers).length !== ids.length ||
    !ids.every((id) =>
      Object.prototype.hasOwnProperty.call(
        solution.answers,
        id
      )
    )
  ) {
    fail(
      500,
      'Una actividad tiene soluciones incompletas.'
    );
  }

  validateKeys(answer, ids);

  const pointsPerItem = score / items.length;

  const review = items.map((item) => {
    const selected = answer[item.id];
    const expected = solution.answers[item.id];

    const allowed =
      activity.type === 'true_false'
        ? [true, false]
        : activity.type === 'fill_blanks'
          ? (config.word_bank || []).map(
              (word) => word.id
            )
          : (item.options || []).map(
              (option) => option.id
            );

    if (!allowed.includes(expected)) {
      fail(
        500,
        'Una actividad tiene una solución inválida.'
      );
    }

    if (!allowed.includes(selected)) {
      fail(
        400,
        'Una respuesta no pertenece a esta actividad.'
      );
    }

    const correct = selected === expected;

    return {
      itemId: item.id,
      correct,
      selectedAnswer: selected,
      correctAnswer: expected,
      pointsEarned: correct ? pointsPerItem : 0,
      pointsPossible: pointsPerItem,
    };
  });

  return {
    activityId: activity.id,
    title: activity.title,
    type: activity.type,
    pointsEarned: review.reduce(
      (total, item) => total + item.pointsEarned,
      0
    ),
    pointsPossible: score,
    items: review,
  };
};

const respondError = (res, error) => {
  console.error(
    'Error en la integradora del módulo 2:',
    error
  );

  const status = [400, 403, 404, 500].includes(
    error.status
  )
    ? error.status
    : 500;

  return res.status(status).json({
    message: error.status
      ? error.message
      : 'No se pudo procesar la evaluación integradora.',
  });
};

// GET: devuelve las actividades sin soluciones.
const getModule2Evaluation = async (req, res) => {
  try {
    const evaluation = await getContext(req.user.id);

    const activities = await EvaluationActivity.findAll({
      where: {
        evaluationId: evaluation.id,
      },
      attributes: PUBLIC_FIELDS,
      order: [['order_number', 'ASC']],
    });

    validateActivities(activities);

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
      maximumScore: 10,
      passingPercentage: 70,
      passed: Boolean(passedAttempt),
      percentage: passedAttempt?.score ?? null,
      activities,
    });
  } catch (error) {
    return respondError(res, error);
  }
};

// POST: califica y guarda el intento.
const submitModule2Evaluation = async (req, res) => {
  try {
    const evaluation = await getContext(req.user.id);

    const activities = await EvaluationActivity
      .scope('withSolution')
      .findAll({
        where: {
          evaluationId: evaluation.id,
        },
        order: [['order_number', 'ASC']],
      });

    validateActivities(activities);

    const { answers } = req.body || {};

    if (
      !Array.isArray(answers) ||
      answers.length !== activities.length
    ) {
      fail(400, 'Debes completar las cinco actividades.');
    }

    const selected = new Map();

    for (const entry of answers) {
      if (
        !isObject(entry) ||
        !Number.isInteger(entry.activityId) ||
        selected.has(entry.activityId)
      ) {
        fail(
          400,
          'Hay actividades repetidas o identificadores inválidos.'
        );
      }

      selected.set(entry.activityId, entry.answer);
    }

    if (
      !activities.every((activity) =>
        selected.has(activity.id)
      )
    ) {
      fail(
        400,
        'Las respuestas no corresponden a esta evaluación.'
      );
    }

    const review = activities.map((activity) =>
      gradeActivity(
        activity,
        selected.get(activity.id)
      )
    );

    const earnedScore = review.reduce(
      (total, activity) =>
        total + activity.pointsEarned,
      0
    );

    const maximumScore = review.reduce(
      (total, activity) =>
        total + activity.pointsPossible,
      0
    );

    const rawPercentage =
      (earnedScore / maximumScore) * 100;

    const passed = rawPercentage >= 70;
    const percentage = Number(
      rawPercentage.toFixed(2)
    );

    const attempt = await sequelize.transaction(
      async (transaction) => {
        const saved = await EvaluationAttempt.create(
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

        // No finaliza el curso ni genera certificado.
        return saved;
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
    return respondError(res, error);
  }
};

module.exports = {
  getModule2Evaluation,
  submitModule2Evaluation,
};