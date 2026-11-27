const {
  Course,
  Module,
  CourseTeacher,
  Evaluation,
  EvaluationActivity,
  Question,
  Option,
  EvaluationAttempt,
  User,
} = require('../models');

const fail = (status, message) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};

const validId = (value) => {
  const id = Number(value);

  if (!Number.isSafeInteger(id) || id < 1) {
    fail(
      400,
      'El identificador de evaluación no es válido.'
    );
  }

  return id;
};

const handleError = (res, error, fallback) => {
  if (error.status) {
    return res.status(error.status).json({
      message: error.message,
    });
  }

  console.error(fallback, error);

  return res.status(500).json({
    message: fallback,
  });
};

const authorizeEvaluation = async (req) => {
  const evaluationId = validId(
    req.params.evaluationId
  );

  if (
    !['DOCENTE', 'ADMIN', 'SUPERADMIN'].includes(
      req.user.role
    )
  ) {
    fail(
      403,
      'No tienes permisos para gestionar evaluaciones.'
    );
  }

  const evaluation =
    await Evaluation.findByPk(evaluationId);

  if (!evaluation) {
    fail(404, 'Evaluación no encontrada.');
  }

  const moduleItem = await Module.findOne({
    where: {
      id: evaluation.moduleId,
      courseId: evaluation.courseId,
    },
  });

  if (!moduleItem) {
    fail(
      409,
      'La evaluación no tiene un módulo y curso válidos.'
    );
  }

  const course = await Course.findByPk(
    evaluation.courseId
  );

  if (!course) {
    fail(404, 'Curso no encontrado.');
  }

  if (req.user.role === 'DOCENTE') {
    if (course.status !== true) {
      fail(
        403,
        'El curso no está disponible.'
      );
    }

    const assignment =
      await CourseTeacher.findOne({
        where: {
          userId: req.user.id,
          courseId: course.id,
        },
      });

    if (!assignment) {
      fail(
        403,
        'No tienes asignado el curso de esta evaluación.'
      );
    }
  }

  return evaluation;
};

// Consulta docente.
// No utiliza las rutas del participante
// ni exige aprobar previamente los temas.
const getTeachingEvaluation = async (req, res) => {
  try {
    const evaluation =
      await authorizeEvaluation(req);

    const [
      questions,
      activities,
      attemptsCount,
    ] = await Promise.all([
      Question.findAll({
        where: {
          evaluationId: evaluation.id,
        },
        attributes: [
          'id',
          'text',
          'score',
        ],
        include: [
          {
            model: Option,
            attributes: [
              'id',
              'text',
              'is_correct',
            ],
          },
        ],
        order: [['id', 'ASC']],
      }),

      EvaluationActivity.findAll({
        where: {
          evaluationId: evaluation.id,
        },
        attributes: [
          'id',
          'activity_key',
          'type',
          'title',
          'instructions',
          'score',
          'order_number',
        ],
        order: [['order_number', 'ASC']],
      }),

      EvaluationAttempt.count({
        where: {
          evaluationId: evaluation.id,
        },
      }),
    ]);

    const practical =
      Number(evaluation.courseId) === 1 &&
      Number.isInteger(Number(evaluation.id)) &&
      evaluation.title ===
        'Evaluación — Tema 2.3: Espacios urbanos (actividad práctica)';

    const format = practical
      ? 'practical'
      : activities.length
        ? 'mixed'
        : questions.length
          ? 'multiple_choice'
          : 'empty';

    return res.status(200).json({
      id: evaluation.id,
      title: evaluation.title,
      moduleId: evaluation.moduleId,
      courseId: evaluation.courseId,
      format,
      attemptsCount,
      hasAttempts: attemptsCount > 0,

      questions: questions.map((question) => ({
        id: question.id,
        text: question.text,
        score: Number(question.score),

        options: [...(question.Options || [])]
          .sort(
            (first, second) =>
              Number(first.id) - Number(second.id)
          )
          .map((option) => ({
            id: option.id,
            text: option.text,
            isCorrect:
              option.is_correct === true,
          })),
      })),

      activities: activities.map((activity) => ({
        id: activity.id,
        type: activity.type,
        title: activity.title,
        instructions: activity.instructions,
        score: Number(activity.score),
      })),

      practicalFields: practical
        ? [
            'Espacio urbano seleccionado',
            'Problema identificado',
            'Personas afectadas',
            'Propuesta de mejora',
            'Participación ciudadana',
            'Resultado esperado',
          ]
        : [],
    });
  } catch (error) {
    return handleError(
      res,
      error,
      'No se pudo consultar la evaluación.'
    );
  }
};

// Resultados paginados del curso autorizado.
const getTeachingEvaluationResults = async (
  req,
  res
) => {
  try {
    const evaluation =
      await authorizeEvaluation(req);

    const page =
      req.query.page === undefined
        ? 1
        : Number(req.query.page);

    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      page > 100000
    ) {
      fail(
        400,
        'El número de página no es válido.'
      );
    }

    const limit = 25;

    const { count, rows } =
      await EvaluationAttempt.findAndCountAll({
        where: {
          evaluationId: evaluation.id,
        },
        attributes: [
          'id',
          'userId',
          'score',
          'passed',
          'attempted_at',
        ],
        include: [
          {
            model: User,
            attributes: ['id', 'name'],
          },
        ],
        order: [
          ['attempted_at', 'DESC'],
          ['id', 'DESC'],
        ],
        limit,
        offset: (page - 1) * limit,
      });

    return res.status(200).json({
      evaluationId: evaluation.id,
      title: evaluation.title,
      page,
      total: count,
      totalPages: Math.max(
        1,
        Math.ceil(count / limit)
      ),

      attempts: rows.map((attempt) => ({
        id: attempt.id,
        participantName:
          attempt.User?.name ||
          'Participante',
        score: Number(attempt.score),
        passed: attempt.passed === true,
        attemptedAt: attempt.attempted_at,
      })),
    });
  } catch (error) {
    return handleError(
      res,
      error,
      'No se pudieron consultar los resultados.'
    );
  }
};

module.exports = {
  getTeachingEvaluation,
  getTeachingEvaluationResults,
};