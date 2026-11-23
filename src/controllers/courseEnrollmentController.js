const {
  Course,
  UserCourse,
  VideoProgress,
  Video,
  Module,
  EvaluationAttempt,
  Evaluation,
} = require('../models');

// Reconoce inscripciones y actividad anterior del usuario.
const getStartedCourses = async (req, res) => {
  try {
    const userId = req.user.id;

    const [enrollments, videos, attempts] = await Promise.all([
      UserCourse.findAll({
        where: { userId },
        attributes: ['courseId'],
        raw: true,
      }),

      VideoProgress.findAll({
        where: { userId },
        attributes: [
          'videoId',
          'percentage',
          'time_watched',
          'is_completed',
        ],
        include: [
          {
            model: Video,
            attributes: ['id'],
            include: [
              {
                model: Module,
                attributes: ['courseId'],
              },
            ],
          },
        ],
      }),

      EvaluationAttempt.findAll({
        where: { userId },
        attributes: ['evaluationId'],
        include: [
          {
            model: Evaluation,
            attributes: ['courseId'],
          },
        ],
      }),
    ]);

    const ids = [
      ...enrollments.map((row) => row.courseId),

      ...videos
        .filter(
          (row) =>
            Number(row.percentage) > 0 ||
            Number(row.time_watched) > 0 ||
            row.is_completed === true
        )
        .map((row) => row.Video?.Module?.courseId),

      ...attempts.map((row) => row.Evaluation?.courseId),
    ]
      .map(Number)
      .filter((id) => Number.isSafeInteger(id) && id > 0);

    return res.json({
      courseIds: [...new Set(ids)],
    });
  } catch (error) {
    console.error(
      'Error consultando cursos iniciados:',
      error
    );

    return res.status(500).json({
      message:
        'No se pudo consultar si ya comenzaste el curso.',
    });
  }
};

const startCourse = async (req, res) => {
  const courseId = Number(req.params.courseId);

  if (!Number.isSafeInteger(courseId) || courseId < 1) {
    return res.status(400).json({
      message: 'Curso inválido.',
    });
  }

  try {
    const course = await Course.findOne({
      where: {
        id: courseId,
        status: true,
      },
      attributes: ['id'],
    });

    if (!course) {
      return res.status(404).json({
        message: 'El curso no está disponible.',
      });
    }

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

    return res.json({
      courseId,
      started: true,
    });
  } catch (error) {
    console.error(
      'Error registrando inicio del curso:',
      error
    );

    return res.status(500).json({
      message:
        'No se pudo iniciar el curso. Intenta nuevamente.',
    });
  }
};

module.exports = {
  getStartedCourses,
  startCourse,
};