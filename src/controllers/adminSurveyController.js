const {
  sequelize,
  Course,
  User,
} = require('../models');

const CourseSurvey = require('../models/CourseSurvey');

const AGREEMENT_LABELS = [
  'Nada',
  'Poco',
  'Moderadamente',
  'Bastante',
  'Mucho',
];

const SATISFACTION_LABELS = [
  'Muy insatisfecho/a',
  'Insatisfecho/a',
  'Ni satisfecho/a ni insatisfecho/a',
  'Satisfecho/a',
  'Muy satisfecho/a',
];

const QUESTIONS = [
  {
    key: 'clarity',
    text: '¿Los contenidos del curso fueron claros y fáciles de comprender?',
    labels: AGREEMENT_LABELS,
  },
  {
    key: 'activities',
    text: '¿Las actividades y evaluaciones estuvieron relacionadas con los contenidos del curso?',
    labels: AGREEMENT_LABELS,
  },
  {
    key: 'usability',
    text: '¿La plataforma fue fácil de utilizar?',
    labels: AGREEMENT_LABELS,
  },
  {
    key: 'satisfaction',
    text: '¿Qué tan satisfecho/a estás con el curso?',
    labels: SATISFACTION_LABELS,
  },
];

const RECOMMENDATIONS = [
  { value: 'YES', label: 'Sí' },
  { value: 'MAYBE', label: 'Tal vez' },
  { value: 'NO', label: 'No' },
];

const getSurveyResults = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const page = Number(req.query.page ?? 1);

    if (
      !Number.isSafeInteger(courseId) ||
      courseId < 1
    ) {
      return res.status(400).json({
        message: 'El identificador del curso no es válido.',
      });
    }

    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      page > 100000
    ) {
      return res.status(400).json({
        message: 'La página solicitada no es válida.',
      });
    }

    const limit = 10;

    const data = await sequelize.transaction(
      {
        isolationLevel: 'REPEATABLE READ',
      },
      async (transaction) => {
        const course = await Course.findByPk(courseId, {
          attributes: ['id', 'name'],
          transaction,
        });

        if (!course) return null;

        const allRows = await CourseSurvey.findAll({
          where: { courseId },

          attributes: [
            'id',
            'userId',
            'answers',
            'recommendation',
            'liked',
            'createdAt',
          ],

          order: [
            ['createdAt', 'DESC'],
            ['id', 'DESC'],
          ],

          raw: true,
          transaction,
        });

        const rows = allRows.filter(
          (row) => row.answers?._version === 2
        );

        const total = rows.length;
        const legacyTotal = allRows.length - total;

        const questions = QUESTIONS.map((question) => {
          const distribution = question.labels.map(
            (label, index) => ({
              value: index + 1,
              label,
              count: 0,
            })
          );

          let sum = 0;
          let responses = 0;

          for (const row of rows) {
            const value = row.answers?.[question.key];

            if (
              !Number.isInteger(value) ||
              value < 1 ||
              value > 5
            ) {
              continue;
            }

            distribution[value - 1].count += 1;
            sum += value;
            responses += 1;
          }

          return {
            ...question,
            responses,

            average:
              responses > 0
                ? Number((sum / responses).toFixed(2))
                : null,

            distribution: distribution.map((item) => ({
              ...item,

              percentage:
                responses > 0
                  ? Number(
                      (
                        (item.count / responses) * 100
                      ).toFixed(1)
                    )
                  : 0,
            })),
          };
        });

        const recommendations = RECOMMENDATIONS.map(
          (item) => {
            const count = rows.filter(
              (row) =>
                row.recommendation === item.value
            ).length;

            return {
              ...item,
              count,

              percentage:
                total > 0
                  ? Number(
                      ((count / total) * 100).toFixed(1)
                    )
                  : 0,
            };
          }
        );

        const responses = rows.slice(
          (page - 1) * limit,
          page * limit
        );

        const userIds = [
          ...new Set(
            responses.map((response) => response.userId)
          ),
        ];

        const users =
          userIds.length > 0
            ? await User.findAll({
                where: { id: userIds },
                attributes: ['id', 'name', 'email'],
                raw: true,
                transaction,
              })
            : [];

        const usersById = new Map(
          users.map((user) => [
            Number(user.id),
            user,
          ])
        );

        const satisfaction = questions.find(
          (question) =>
            question.key === 'satisfaction'
        );

        return {
          course: {
            id: course.id,
            name: course.name,
          },

          total,
          legacyTotal,

          satisfactionAverage:
            satisfaction?.average ?? null,

          questions,
          recommendations,

          responses: responses.map((response) => {
            const participant = usersById.get(
              Number(response.userId)
            );

            return {
              ...response,

              participant: {
                id: response.userId,

                name:
                  participant?.name ||
                  'Participante no disponible',

                email: participant?.email || '',
              },
            };
          }),

          page,
          totalPages: Math.max(
            1,
            Math.ceil(total / limit)
          ),
        };
      }
    );

    if (!data) {
      return res.status(404).json({
        message: 'Curso no encontrado.',
      });
    }

    return res.json(data);
  } catch (error) {
    console.error(
      'Error consultando resultados de encuestas:',
      error
    );

    return res.status(500).json({
      message:
        'No se pudieron consultar los resultados de la encuesta.',
    });
  }
};

module.exports = {
  getSurveyResults,
};