const {
  User,
  Course,
  Module,
  Topic,
  CourseTeacher,
  UserCourse,
  Evaluation,
  EvaluationAttempt,
  Foro,
  ForoComment,
} = require('../models');

const fail = (status, message) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};

const validId = (value) => {
  const id = Number(value);

  if (!Number.isSafeInteger(id) || id < 1) {
    fail(400, 'El identificador no es válido.');
  }

  return id;
};

const getPage = (value) => {
  const page = value === undefined
    ? 1
    : Number(value);

  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    page > 100000
  ) {
    fail(400, 'La página no es válida.');
  }

  return page;
};

const respondError = (res, error, fallback) => {
  if (error.status) {
    return res.status(error.status).json({
      message: error.message,
    });
  }

  if (
    error.name ===
    'SequelizeUniqueConstraintError'
  ) {
    return res.status(409).json({
      message:
        'Ya dejaste un comentario en esta publicación.',
    });
  }

  console.error(fallback, error);

  return res.status(500).json({
    message: fallback,
  });
};

const authorizeCourse = async ({
  user,
  courseId,
  transaction,
}) => {
  if (user.role !== 'DOCENTE') {
    fail(
      403,
      'Esta sección corresponde a docentes.'
    );
  }

  const assignment =
    await CourseTeacher.findOne({
      where: {
        userId: user.id,
        courseId,
      },
      transaction,
      ...(transaction
        ? { lock: transaction.LOCK.UPDATE }
        : {}),
    });

  if (!assignment) {
    fail(
      403,
      'No tienes este curso asignado.'
    );
  }

  const course = await Course.findByPk(
    courseId,
    { transaction }
  );

  if (!course || course.status !== true) {
    fail(
      404,
      'El curso no está disponible.'
    );
  }

  return course;
};

const findForumTopic = async ({
  courseId,
  topicNumber,
  transaction,
}) => {
  // Los foros actuales solo guardan topicNumber.
  // Corresponden al curso 1 y no deben mezclarse
  // con temas de otros cursos.
  if (Number(courseId) !== 1) {
    fail(
      409,
      'Los foros actuales están configurados para el curso de Ciudades Inteligentes y Gobierno Digital.'
    );
  }

  if (
    typeof topicNumber !== 'string' ||
    !/^[123]\.[1-4]$/.test(topicNumber)
  ) {
    fail(400, 'El tema no es válido.');
  }

  const topic = await Topic.findOne({
    where: { topicNumber },
    include: [
      {
        model: Module,
        required: true,
        where: { courseId },
        attributes: ['id', 'title'],
      },
    ],
    transaction,
  });

  if (!topic) {
    fail(
      404,
      'El tema no pertenece a este curso.'
    );
  }

  return topic;
};

// GET /courses/:courseId/participants
const getTeachingParticipants = async (
  req,
  res
) => {
  try {
    const courseId = validId(req.params.courseId);
    const page = getPage(req.query.page);
    const limit = 25;

    await authorizeCourse({
      user: req.user,
      courseId,
    });

    const { count, rows } =
      await User.findAndCountAll({
        where: { role: 'USER' },
        attributes: [
          'id',
          'name',
          'email',
          'status',
        ],
        include: [
          {
            model: UserCourse,
            required: true,
            where: { courseId },
            attributes: [],
          },
        ],
        distinct: true,
        order: [
          ['name', 'ASC'],
          ['id', 'ASC'],
        ],
        limit,
        offset: (page - 1) * limit,
      });

    return res.json({
      participants: rows,
      total: count,
      page,
      totalPages: Math.max(
        1,
        Math.ceil(count / limit)
      ),
    });
  } catch (error) {
    return respondError(
      res,
      error,
      'No se pudieron consultar los participantes.'
    );
  }
};

// GET /courses/:courseId/participants/:userId/progress
const getTeachingParticipantProgress = async (
  req,
  res
) => {
  try {
    const courseId = validId(req.params.courseId);
    const userId = validId(req.params.userId);

    await authorizeCourse({
      user: req.user,
      courseId,
    });

    const enrollment = await UserCourse.findOne({
      where: { userId, courseId },
    });

    const participant = await User.findByPk(
      userId,
      {
        attributes: [
          'id',
          'name',
          'email',
          'role',
        ],
      }
    );

    if (
      !enrollment ||
      !participant ||
      participant.role !== 'USER'
    ) {
      fail(
        404,
        'Participante no encontrado en este curso.'
      );
    }

    const {
      getMyProgress,
    } = require('./userController');

    // Reutiliza el cálculo existente.
    // Solo se devuelve el curso autorizado;
    // nunca el resumen de los demás cursos.
    let responseStatus = 200;
    let responseData;

    const responseAdapter = {
      status(code) {
        responseStatus = code;
        return this;
      },

      json(data) {
        responseData = data;
        return this;
      },
    };

    await getMyProgress(
      {
        user: {
          id: userId,
          role: 'ADMIN',
        },
      },
      responseAdapter
    );

    if (
      responseStatus !== 200 ||
      !Array.isArray(responseData?.courses)
    ) {
      fail(
        500,
        'No se pudo calcular el avance del participante.'
      );
    }

    const course = responseData.courses.find(
      (item) =>
        Number(item.id) === courseId
    );

    if (!course) {
      fail(
        404,
        'No se encontró el avance de este curso.'
      );
    }

    const attempts =
      await EvaluationAttempt.findAll({
        where: { userId },
        attributes: [
          'id',
          'score',
          'passed',
          'attempted_at',
        ],
        include: [
          {
            model: Evaluation,
            required: true,
            where: { courseId },
            attributes: ['id', 'title'],
          },
        ],
        order: [
          ['attempted_at', 'DESC'],
          ['id', 'DESC'],
        ],
      });

    return res.json({
      participant: {
        id: participant.id,
        name: participant.name,
        email: participant.email,
      },
      course,
      attempts: attempts.map((attempt) => ({
        id: attempt.id,
        title: attempt.Evaluation.title,
        score: Number(attempt.score),
        passed: attempt.passed === true,
        attemptedAt: attempt.attempted_at,
      })),
    });
  } catch (error) {
    return respondError(
      res,
      error,
      'No se pudo consultar el seguimiento.'
    );
  }
};

// GET /courses/:courseId/forum-topics
const getTeachingForumTopics = async (
  req,
  res
) => {
  try {
    const courseId = validId(req.params.courseId);

    await authorizeCourse({
      user: req.user,
      courseId,
    });

    if (courseId !== 1) {
      return res.json([]);
    }

    const topics = await Topic.findAll({
      attributes: [
        'id',
        'topicNumber',
        'title',
        'moduleId',
      ],
      include: [
        {
          model: Module,
          required: true,
          where: { courseId },
          attributes: ['id', 'title'],
        },
      ],
    });

    return res.json(
      topics
        .map((topic) => ({
          id: topic.id,
          topicNumber: topic.topicNumber,
          title: topic.title,
          moduleId: topic.moduleId,
        }))
        .sort((first, second) =>
          first.topicNumber.localeCompare(
            second.topicNumber,
            'es',
            { numeric: true }
          )
        )
    );
  } catch (error) {
    return respondError(
      res,
      error,
      'No se pudieron consultar los temas del foro.'
    );
  }
};

const serializeComment = (comment) => ({
  id: comment.id,
  userId: comment.userId,
  content: comment.content,
  createdAt: comment.createdAt,
  authorName: comment.User?.name || 'Usuario',
  authorRole: comment.User?.role || 'USER',
});

// GET /courses/:courseId/forums/:topicNumber/posts
const getTeachingForumPosts = async (
  req,
  res
) => {
  try {
    const courseId = validId(req.params.courseId);
    const page = getPage(req.query.page);
    const limit = 20;

    await authorizeCourse({
      user: req.user,
      courseId,
    });

    await findForumTopic({
      courseId,
      topicNumber: req.params.topicNumber,
    });

    const { count, rows } =
      await Foro.findAndCountAll({
        where: {
          topicNumber: req.params.topicNumber,
        },
        include: [
          {
            model: User,
            attributes: ['id', 'name'],
          },
          {
            model: ForoComment,
            separate: true,
            include: [
              {
                model: User,
                attributes: [
                  'id',
                  'name',
                  'role',
                ],
              },
            ],
            order: [
              ['createdAt', 'ASC'],
              ['id', 'ASC'],
            ],
          },
        ],
        distinct: true,
        order: [
          ['createdAt', 'DESC'],
          ['id', 'DESC'],
        ],
        limit,
        offset: (page - 1) * limit,
      });

    return res.json({
      posts: rows.map((post) => ({
        id: post.id,
        userId: post.userId,
        topicNumber: post.topicNumber,
        content: post.content,
        createdAt: post.createdAt,
        authorName:
          post.User?.name || 'Participante',
        comments:
          (post.ForoComments || []).map(
            serializeComment
          ),
      })),
      page,
      totalPages: Math.max(
        1,
        Math.ceil(count / limit)
      ),
    });
  } catch (error) {
    return respondError(
      res,
      error,
      'No se pudieron consultar las publicaciones.'
    );
  }
};

// POST /courses/:courseId/forums/:topicNumber/posts/:postId/comments
const publishTeachingComment = async (
  req,
  res
) => {
  try {
    const courseId = validId(req.params.courseId);
    const postId = validId(req.params.postId);

    const content =
      typeof req.body?.content === 'string'
        ? req.body.content.trim()
        : '';

    if (
      content.length < 10 ||
      content.length > 1000
    ) {
      fail(
        400,
        'Escribe un comentario de entre 10 y 1000 caracteres.'
      );
    }

    const comment =
      await User.sequelize.transaction(
        async (transaction) => {
          const actor = await User.findByPk(
            req.user.id,
            {
              transaction,
              lock: transaction.LOCK.UPDATE,
            }
          );

          if (
            !actor ||
            actor.status !== true
          ) {
            fail(
              401,
              'Tu cuenta no tiene una sesión autorizada.'
            );
          }

          await authorizeCourse({
            user: actor,
            courseId,
            transaction,
          });

          await findForumTopic({
            courseId,
            topicNumber: req.params.topicNumber,
            transaction,
          });

          const post = await Foro.findOne({
            where: {
              id: postId,
              topicNumber:
                req.params.topicNumber,
            },
            transaction,
          });

          if (!post) {
            fail(
              404,
              'Publicación no encontrada.'
            );
          }

          if (
            Number(post.userId) ===
            Number(actor.id)
          ) {
            fail(
              400,
              'Selecciona la publicación de un participante.'
            );
          }

          const existing =
            await ForoComment.findOne({
              where: {
                postId,
                userId: actor.id,
              },
              transaction,
            });

          if (existing) {
            fail(
              409,
              'Ya dejaste un comentario en esta publicación.'
            );
          }

          const created =
            await ForoComment.create(
              {
                postId,
                userId: actor.id,
                content,
              },
              { transaction }
            );

          // notificationController detectará este
          // comentario como aviso para el autor del post.
          // No se modifica progreso, notas ni evaluaciones.
          return {
            id: created.id,
            userId: actor.id,
            authorName: actor.name,
            authorRole: actor.role,
            content: created.content,
            createdAt: created.createdAt,
          };
        }
      );

    return res.status(201).json(comment);
  } catch (error) {
    return respondError(
      res,
      error,
      'No se pudo publicar el comentario docente.'
    );
  }
};

module.exports = {
  getTeachingParticipants,
  getTeachingParticipantProgress,
  getTeachingForumTopics,
  getTeachingForumPosts,
  publishTeachingComment,
};