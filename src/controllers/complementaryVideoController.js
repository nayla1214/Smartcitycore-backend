const {
  sequelize,
  User,
  Course,
  Module,
  Topic,
  CourseTeacher,
  UserCourse,
} = require('../models');

const ComplementaryVideo =
  require('../models/ComplementaryVideo');

const fail = (status, message) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};

const getId = (value) => {
  const id = Number(value);

  if (!Number.isSafeInteger(id) || id < 1) {
    fail(400, 'El identificador no es válido.');
  }

  return id;
};

const getYoutubeId = (value) => {
  if (typeof value !== 'string') return null;

  const text = value.trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(text)) {
    return text;
  }

  let url;

  try {
    url = new URL(text);
  } catch {
    return null;
  }

  if (
    !['https:', 'http:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.port
  ) {
    return null;
  }

  const host = url.hostname.toLowerCase();
  let id = null;

  if (
    ['youtu.be', 'www.youtu.be'].includes(host)
  ) {
    const parts = url.pathname
      .split('/')
      .filter(Boolean);

    if (parts.length === 1) {
      id = parts[0];
    }
  } else if (
    [
      'youtube.com',
      'www.youtube.com',
      'm.youtube.com',
      'youtube-nocookie.com',
      'www.youtube-nocookie.com',
    ].includes(host)
  ) {
    if (
      url.pathname === '/watch' ||
      url.pathname === '/watch/'
    ) {
      id = url.searchParams.get('v');
    } else {
      const match = url.pathname.match(
        /^\/(?:embed|shorts|live)\/([a-zA-Z0-9_-]{11})\/?$/
      );

      id = match?.[1] || null;
    }
  }

  return id && /^[a-zA-Z0-9_-]{11}$/.test(id)
    ? id
    : null;
};

const serialize = (video) => ({
  id: video.id,
  moduleId: video.moduleId,
  topicNumber: video.topicNumber,
  title: video.title,
  description: video.description,
  youtubeId: video.youtubeId,
  url:
    `https://www.youtube.com/watch?v=${video.youtubeId}`,
  isComplementary: true,
  createdAt: video.createdAt,
});

const handleError = (res, error, fallback) => {
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
        'Este video ya está registrado en el módulo. Puedes cambiar su tema desde la lista.',
    });
  }

  console.error(fallback, error);

  return res.status(500).json({
    message: fallback,
  });
};

const authorizeModule = async ({
  user,
  moduleId,
  write = false,
  transaction,
}) => {
  const module = await Module.findByPk(
    moduleId,
    { transaction }
  );

  if (!module) {
    fail(404, 'Módulo no encontrado.');
  }

  const course = await Course.findByPk(
    module.courseId,
    { transaction }
  );

  if (!course || course.status !== true) {
    fail(404, 'El curso no está disponible.');
  }

  if (
    ['ADMIN', 'SUPERADMIN'].includes(user.role)
  ) {
    return;
  }

  if (user.role === 'DOCENTE') {
    const assignment =
      await CourseTeacher.findOne({
        where: {
          userId: user.id,
          courseId: course.id,
        },
        transaction,
        ...(transaction
          ? { lock: transaction.LOCK.UPDATE }
          : {}),
      });

    if (!assignment) {
      fail(
        403,
        'No tienes asignado el curso de este módulo.'
      );
    }

    return;
  }

  if (write || user.role !== 'USER') {
    fail(
      403,
      'No tienes permisos para gestionar estos recursos.'
    );
  }

  const enrollment = await UserCourse.findOne({
    where: {
      userId: user.id,
      courseId: course.id,
    },
    transaction,
  });

  if (!enrollment) {
    fail(
      403,
      'Primero debes iniciar este curso.'
    );
  }
};

const validateTopic = async (
  moduleId,
  value,
  transaction
) => {
  if (
    typeof value !== 'string' ||
    !value.trim() ||
    value.trim().length > 30
  ) {
    fail(400, 'Selecciona un tema válido.');
  }

  const topicNumber = value.trim();

  const topic = await Topic.findOne({
    where: {
      moduleId,
      topicNumber,
    },
    transaction,
  });

  if (!topic) {
    fail(
      400,
      'El tema seleccionado no pertenece a este módulo.'
    );
  }

  return topic.topicNumber;
};

const getActiveActor = async (
  userId,
  transaction
) => {
  const actor = await User.findByPk(userId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (!actor || actor.status !== true) {
    fail(
      401,
      'Tu cuenta no tiene una sesión autorizada.'
    );
  }

  return actor;
};

// Docentes: pueden consultar todo el módulo.
// Participantes: deben indicar el tema.
const getComplementaryVideos = async (
  req,
  res
) => {
  try {
    const moduleId = getId(req.params.moduleId);

    await authorizeModule({
      user: req.user,
      moduleId,
    });

    const where = { moduleId };

    if (req.query.topicNumber !== undefined) {
      where.topicNumber = await validateTopic(
        moduleId,
        req.query.topicNumber
      );
    } else if (req.user.role === 'USER') {
      fail(
        400,
        'Indica el tema para consultar sus videos.'
      );
    }

    const videos =
      await ComplementaryVideo.findAll({
        where,
        order: [
          ['createdAt', 'ASC'],
          ['id', 'ASC'],
        ],
      });

    return res.status(200).json(
      videos.map(serialize)
    );
  } catch (error) {
    return handleError(
      res,
      error,
      'No se pudieron consultar los videos complementarios.'
    );
  }
};

const createComplementaryVideo = async (
  req,
  res
) => {
  try {
    const moduleId = getId(req.params.moduleId);
    const body = req.body;

    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body)
    ) {
      fail(400, 'Los datos no son válidos.');
    }

    const allowedFields = [
      'title',
      'description',
      'url',
      'topicNumber',
    ];

    if (
      Object.keys(body).some(
        (field) => !allowedFields.includes(field)
      )
    ) {
      fail(
        400,
        'Solo puedes enviar título, descripción, enlace y tema.'
      );
    }

    if (
      typeof body.title !== 'string' ||
      !body.title.trim() ||
      body.title.trim().length > 255
    ) {
      fail(
        400,
        'Ingresa un título de hasta 255 caracteres.'
      );
    }

    if (
      body.description !== undefined &&
      (
        typeof body.description !== 'string' ||
        body.description.length > 20000
      )
    ) {
      fail(
        400,
        'La descripción debe tener hasta 20000 caracteres.'
      );
    }

    const youtubeId = getYoutubeId(body.url);

    if (!youtubeId) {
      fail(
        400,
        'Ingresa un enlace válido de YouTube.'
      );
    }

    const video = await sequelize.transaction(
      async (transaction) => {
        const actor = await getActiveActor(
          req.user.id,
          transaction
        );

        await authorizeModule({
          user: actor,
          moduleId,
          write: true,
          transaction,
        });

        const topicNumber = await validateTopic(
          moduleId,
          body.topicNumber,
          transaction
        );

        return ComplementaryVideo.create(
          {
            moduleId,
            topicNumber,
            createdBy: actor.id,
            title: body.title.trim(),
            description:
              body.description?.trim() || '',
            youtubeId,
          },
          { transaction }
        );
      }
    );

    return res.status(201).json(
      serialize(video)
    );
  } catch (error) {
    return handleError(
      res,
      error,
      'No se pudo agregar el video complementario.'
    );
  }
};

// Asignar o cambiar el tema de un video existente.
const updateComplementaryVideoTopic = async (
  req,
  res
) => {
  try {
    const videoId = getId(req.params.videoId);
    const body = req.body;

    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body) ||
      Object.keys(body).length !== 1 ||
      !Object.prototype.hasOwnProperty.call(
        body,
        'topicNumber'
      )
    ) {
      fail(
        400,
        'Envía únicamente el tema del video.'
      );
    }

    const updated = await sequelize.transaction(
      async (transaction) => {
        const actor = await getActiveActor(
          req.user.id,
          transaction
        );

        const existing =
          await ComplementaryVideo.findByPk(
            videoId,
            { transaction }
          );

        if (!existing) {
          fail(404, 'Video no encontrado.');
        }

        await authorizeModule({
          user: actor,
          moduleId: existing.moduleId,
          write: true,
          transaction,
        });

        const topicNumber = await validateTopic(
          existing.moduleId,
          body.topicNumber,
          transaction
        );

        const video =
          await ComplementaryVideo.findByPk(
            videoId,
            {
              transaction,
              lock: transaction.LOCK.UPDATE,
            }
          );

        if (
          !video ||
          Number(video.moduleId) !==
            Number(existing.moduleId)
        ) {
          fail(
            409,
            'El recurso cambió. Actualiza la página.'
          );
        }

        await video.update(
          { topicNumber },
          { transaction }
        );

        return video;
      }
    );

    return res.status(200).json(
      serialize(updated)
    );
  } catch (error) {
    return handleError(
      res,
      error,
      'No se pudo actualizar el tema del video.'
    );
  }
};

module.exports = {
  getComplementaryVideos,
  createComplementaryVideo,
  updateComplementaryVideoTopic,
};