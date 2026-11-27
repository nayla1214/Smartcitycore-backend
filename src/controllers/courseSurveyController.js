const {
  Module,
  Evaluation,
  EvaluationAttempt,
} = require('../models');

const CourseSurvey = require('../models/CourseSurvey');

const QUESTION_KEYS = [
  'clarity',
  'activities',
  'usability',
  'satisfaction',
];

const fail = (status, message) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};

const getContext = async (req) => {
  if (req.user?.role !== 'USER') {
    fail(
      403,
      'La encuesta está disponible para participantes.'
    );
  }

  const courseId = Number(req.params.courseId);

  if (!Number.isSafeInteger(courseId) || courseId < 1) {
    fail(400, 'El identificador del curso no es válido.');
  }

  if (courseId !== 1) {
    fail(
      404,
      'La encuesta todavía no está configurada para este curso.'
    );
  }

  const modules = await Module.findAll({
    where: {
      courseId,
      order_number: 3,
    },
    attributes: ['id'],
  });

  if (modules.length !== 1) {
    fail(
      409,
      'No se pudo identificar el módulo final del curso.'
    );
  }

  const evaluations = await Evaluation.findAll({
    where: {
      courseId,
      moduleId: modules[0].id,
      is_final: false,
    },
    attributes: ['id', 'title'],
  });

  const integrators = evaluations.filter((evaluation) =>
    /evaluaci[oó]n\s+integradora\s+del\s+m[oó]dulo\s+3\b/i.test(
      evaluation.title || ''
    )
  );

  if (integrators.length !== 1) {
    fail(
      409,
      'No se pudo identificar la evaluación integradora del módulo 3.'
    );
  }

  const passedAttempt = await EvaluationAttempt.findOne({
    where: {
      userId: req.user.id,
      evaluationId: integrators[0].id,
      passed: true,
    },
    attributes: ['id'],
  });

  return {
    courseId,
    eligible: Boolean(passedAttempt),
  };
};

const sendError = (res, error) => {
  if (!error.status) {
    console.error('Error en encuesta del curso:', error);
  }

  return res.status(error.status || 500).json({
    message: error.status
      ? error.message
      : 'No se pudo procesar la encuesta.',
  });
};

const getMySurvey = async (req, res) => {
  try {
    const { courseId, eligible } = await getContext(req);

    const survey = await CourseSurvey.findOne({
      where: {
        userId: req.user.id,
        courseId,
      },
      attributes: ['id', 'createdAt'],
    });

    return res.json({
      eligible,
      submitted: Boolean(survey),
      submittedAt: survey?.createdAt ?? null,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const submitMySurvey = async (req, res) => {
  try {
    const { courseId, eligible } = await getContext(req);

    if (!eligible) {
      fail(
        403,
        'Aprueba la evaluación integradora del módulo 3 para responder la encuesta.'
      );
    }

    const body = req.body || {};

    const allowedFields = [
      'answers',
      'recommendation',
      'liked',
    ];

    if (
      Object.keys(body).some(
        (key) => !allowedFields.includes(key)
      )
    ) {
      fail(400, 'La encuesta contiene campos no válidos.');
    }

    const answers = body.answers;

    if (
      !answers ||
      typeof answers !== 'object' ||
      Array.isArray(answers) ||
      Object.keys(answers).length !== QUESTION_KEYS.length ||
      !QUESTION_KEYS.every(
        (key) =>
          Object.prototype.hasOwnProperty.call(answers, key) &&
          Number.isInteger(answers[key]) &&
          answers[key] >= 1 &&
          answers[key] <= 5
      )
    ) {
      fail(
        400,
        'Responde las primeras cuatro preguntas seleccionando una opción en cada una.'
      );
    }

    if (
      !['YES', 'MAYBE', 'NO'].includes(body.recommendation)
    ) {
      fail(
        400,
        'Indica si recomendarías el curso.'
      );
    }

    if (
      body.liked !== undefined &&
      typeof body.liked !== 'string'
    ) {
      fail(400, 'El comentario debe contener texto.');
    }

    const liked = (body.liked || '').trim();

    if (liked.length > 2000) {
      fail(
        400,
        'El comentario admite hasta 2000 caracteres.'
      );
    }

    const [survey, created] =
      await CourseSurvey.findOrCreate({
        where: {
          userId: req.user.id,
          courseId,
        },

        defaults: {
          userId: req.user.id,
          courseId,

          answers: {
            _version: 2,

            ...Object.fromEntries(
              QUESTION_KEYS.map((key) => [
                key,
                answers[key],
              ])
            ),
          },

          recommendation: body.recommendation,
          liked,
          improvements: '',
        },
      });

    return res.status(created ? 201 : 200).json({
      submitted: true,
      submittedAt: survey.createdAt,

      message: created
        ? 'Gracias por compartir tu opinión.'
        : 'Tu opinión ya estaba registrada.',
    });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  getMySurvey,
  submitMySurvey,
};