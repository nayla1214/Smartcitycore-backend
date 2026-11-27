const {
  User,
  Course,
  CourseTeacher,
  Video,
  VideoProgress,
  Module,
} = require('../models');

const httpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

// POST /api/videos
// Administración.
const createVideo = async (req, res) => {
  try {
    const {
      moduleId,
      title,
      description,
      url,
      duration,
      order_number,
      status,
    } = req.body;

    const video = await Video.create({
      moduleId,
      title,
      description,
      url,
      duration,
      order_number,
      status,
    });

    return res.status(201).json(video);
  } catch (error) {
    console.error('Error al crear video:', error);

    return res.status(500).json({
      message: 'No se pudo crear el video.',
    });
  }
};

// GET /api/videos/module/:moduleId
const getVideosByModule = async (req, res) => {
  try {
    const videos = await Video.findAll({
      where: {
        moduleId: req.params.moduleId,
      },
      order: [['order_number', 'ASC']],
    });

    return res.status(200).json(videos);
  } catch (error) {
    console.error(
      'Error al consultar videos:',
      error
    );

    return res.status(500).json({
      message: 'No se pudieron consultar los videos.',
    });
  }
};

// PUT /api/videos/:videoId/content
// Administración o docente del curso asignado.
const updateVideoContent = async (req, res) => {
  try {
    const videoId = Number(req.params.videoId);

    if (
      !Number.isSafeInteger(videoId) ||
      videoId < 1
    ) {
      return res.status(400).json({
        message:
          'El identificador del video no es válido.',
      });
    }

    const body = req.body;

    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body)
    ) {
      return res.status(400).json({
        message: 'Los datos enviados no son válidos.',
      });
    }

    const allowedFields = [
      'title',
      'description',
    ];

    if (
      Object.keys(body).some(
        (field) => !allowedFields.includes(field)
      )
    ) {
      return res.status(400).json({
        message:
          'En esta sección solo puedes editar el título y la descripción del video.',
      });
    }

    const changes = {};

    if (body.title !== undefined) {
      if (
        typeof body.title !== 'string' ||
        !body.title.trim() ||
        body.title.trim().length > 255
      ) {
        return res.status(400).json({
          message:
            'Ingresa un título de hasta 255 caracteres.',
        });
      }

      changes.title = body.title.trim();
    }

    if (body.description !== undefined) {
      if (
        typeof body.description !== 'string' ||
        body.description.length > 20000
      ) {
        return res.status(400).json({
          message:
            'La descripción debe ser texto de hasta 20000 caracteres.',
        });
      }

      changes.description =
        body.description.trim();
    }

    if (!Object.keys(changes).length) {
      return res.status(400).json({
        message:
          'Envía el título o la descripción para actualizar.',
      });
    }

    const updated =
      await Video.sequelize.transaction(
        async (transaction) => {
          // Volver a comprobar la cuenta dentro
          // de la transacción de escritura.
          const actor = await User.findByPk(
            req.user.id,
            {
              transaction,
              lock: transaction.LOCK.UPDATE,
            }
          );

          if (!actor || actor.status !== true) {
            throw httpError(
              401,
              'Tu cuenta no tiene una sesión autorizada.'
            );
          }

          const isManagement = [
            'ADMIN',
            'SUPERADMIN',
          ].includes(actor.role);

          if (
            !isManagement &&
            actor.role !== 'DOCENTE'
          ) {
            throw httpError(
              403,
              'No tienes permisos para editar videos.'
            );
          }

          const existingVideo =
            await Video.findByPk(videoId, {
              transaction,
            });

          if (!existingVideo) {
            throw httpError(
              404,
              'Video no encontrado.'
            );
          }

          const existingModule =
            await Module.findByPk(
              existingVideo.moduleId,
              { transaction }
            );

          if (!existingModule) {
            throw httpError(
              404,
              'El módulo del video no está disponible.'
            );
          }

          if (actor.role === 'DOCENTE') {
            const assignment =
              await CourseTeacher.findOne({
                where: {
                  userId: actor.id,
                  courseId:
                    existingModule.courseId,
                },
                transaction,
                lock: transaction.LOCK.UPDATE,
              });

            if (!assignment) {
              throw httpError(
                403,
                'No tienes asignado el curso de este video.'
              );
            }
          }

          const course = await Course.findByPk(
            existingModule.courseId,
            {
              transaction,
              lock: transaction.LOCK.UPDATE,
            }
          );

          if (
            !course ||
            (
              actor.role === 'DOCENTE' &&
              course.status !== true
            )
          ) {
            throw httpError(
              404,
              'El curso no está disponible.'
            );
          }

          const moduleItem =
            await Module.findByPk(
              existingModule.id,
              {
                transaction,
                lock: transaction.LOCK.UPDATE,
              }
            );

          if (
            !moduleItem ||
            Number(moduleItem.courseId) !==
              Number(course.id)
          ) {
            throw httpError(
              409,
              'La ubicación del módulo cambió. Actualiza la página.'
            );
          }

          const video = await Video.findByPk(
            videoId,
            {
              transaction,
              lock: transaction.LOCK.UPDATE,
            }
          );

          if (
            !video ||
            Number(video.moduleId) !==
              Number(moduleItem.id)
          ) {
            throw httpError(
              409,
              'La ubicación del video cambió. Actualiza la página.'
            );
          }

          await video.update(
            changes,
            { transaction }
          );

          return {
            id: video.id,
            moduleId: video.moduleId,
            title: video.title,
            description: video.description,
          };
        }
      );

    return res.status(200).json(updated);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        message: error.message,
      });
    }

    console.error(
      'Error al editar contenido del video:',
      error
    );

    return res.status(500).json({
      message:
        'No se pudo actualizar el video.',
    });
  }
};

// POST /api/videos/progress
// Conserva el mecanismo de seguimiento existente.
const updateProgress = async (req, res) => {
  try {
    const videoId = Number(req.body.videoId);
    const currentTime =
      Number(req.body.current_time);
    const duration = Number(req.body.duration);
    const isEnded = req.body.isEnded === true;
    const userId = req.user.id;

    if (
      !Number.isInteger(videoId) ||
      !Number.isFinite(currentTime) ||
      !Number.isFinite(duration) ||
      currentTime < 0 ||
      duration <= 0 ||
      currentTime > duration + 2
    ) {
      return res.status(400).json({
        message: 'Datos del video no válidos.',
      });
    }

    const video = await Video.findByPk(videoId);

    if (!video) {
      return res.status(404).json({
        message: 'Video no encontrado.',
      });
    }

    let progress = await VideoProgress.findOne({
      where: {
        userId,
        videoId,
      },
    });

    const isFirstPing = !progress;

    if (isFirstPing) {
      progress = await VideoProgress.create({
        userId,
        videoId,
        time_watched: 0,
        percentage: 0,
        is_completed: false,
      });
    }

    if (progress.is_completed) {
      return res.status(200).json(progress);
    }

    const previousPosition =
      Number(progress.time_watched) || 0;

    const elapsedSeconds = Math.max(
      0,
      (
        Date.now() -
        new Date(progress.updatedAt).getTime()
      ) / 1000
    );

    // El primer avance llega a los tres segundos.
    // Se limita el tiempo acumulado entre avisos.
    const allowedAdvance = isFirstPing
      ? 5
      : Math.min(elapsedSeconds, 6) + 2;

    const advance =
      currentTime - previousPosition;

    if (advance > allowedAdvance) {
      return res.status(200).json(progress);
    }

    // Retroceder no borra el progreso.
    const verifiedPosition = Math.max(
      previousPosition,
      currentTime
    );

    const reachedEnd =
      currentTime >= duration - 2;

    const isCompleted =
      isEnded &&
      reachedEnd &&
      verifiedPosition >= duration - 2;

    await progress.update({
      time_watched: isCompleted
        ? Math.ceil(duration)
        : Math.floor(verifiedPosition),

      percentage: isCompleted
        ? 100
        : Math.min(
            99,
            (verifiedPosition / duration) * 100
          ),

      is_completed: isCompleted,

      completed_at: isCompleted
        ? new Date()
        : null,
    });

    return res.status(200).json(progress);
  } catch (error) {
    console.error(
      'Error en updateProgress:',
      error
    );

    return res.status(500).json({
      message:
        'No se pudo guardar el progreso del video.',
    });
  }
};

// GET /api/videos/:videoId/progress
const getProgress = async (req, res) => {
  try {
    const progress = await VideoProgress.findOne({
      where: {
        userId: req.user.id,
        videoId: req.params.videoId,
      },
    });

    return res.status(200).json(
      progress || {
        time_watched: 0,
        percentage: 0,
        is_completed: false,
      }
    );
  } catch (error) {
    console.error(
      'Error al consultar progreso del video:',
      error
    );

    return res.status(500).json({
      message:
        'No se pudo consultar el progreso del video.',
    });
  }
};

module.exports = {
  createVideo,
  getVideosByModule,
  updateVideoContent,
  updateProgress,
  getProgress,
};