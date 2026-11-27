const {
  sequelize,
  Course,
  CourseTeacher,
  Module,
  Video,
  Evaluation,
} = require('../models');

const getId = (value) => {
  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0
    ? id
    : null;
};

const httpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const handleError = (res, error, message) => {
  if (error.status) {
    return res.status(error.status).json({
      message: error.message,
    });
  }

  console.error(message, error);

  return res.status(500).json({ message });
};

const checkAssignment = async ({
  userId,
  courseId,
  transaction,
}) => {
  const assignment = await CourseTeacher.findOne({
    where: {
      userId,
      courseId,
    },
    transaction,
    ...(transaction
      ? { lock: transaction.LOCK.UPDATE }
      : {}),
  });

  if (!assignment) {
    throw httpError(
      403,
      'No tienes este curso asignado.'
    );
  }

  const course = await Course.findByPk(courseId, {
    transaction,
    ...(transaction
      ? { lock: transaction.LOCK.UPDATE }
      : {}),
  });

  if (!course || course.status !== true) {
    throw httpError(
      404,
      'El curso no está disponible.'
    );
  }

  return course;
};

// GET /api/teachers/me/courses/:courseId/content
const getTeachingContent = async (req, res) => {
  try {
    const courseId = getId(req.params.courseId);

    if (!courseId) {
      return res.status(400).json({
        message:
          'El identificador del curso no es válido.',
      });
    }

    const course = await checkAssignment({
      userId: req.user.id,
      courseId,
    });

    const modules = await Module.findAll({
      where: { courseId },
      attributes: [
        'id',
        'courseId',
        'title',
        'description',
        'order_number',
      ],
      include: [
        {
          model: Video,
          attributes: [
            'id',
            'title',
             'description',
            'url',
            'duration',
            'order_number',
          ],
        },
        {
          model: Evaluation,
          attributes: [
            'id',
            'title',
            'is_final',
          ],
        },
      ],
      order: [['order_number', 'ASC']],
    });

    const orderedModules = modules.map((item) => {
      const module = item.toJSON();

      module.Videos = (module.Videos || []).sort(
        (first, second) =>
          Number(first.order_number) -
          Number(second.order_number)
      );

      return module;
    });

    return res.status(200).json({
      course: {
        id: course.id,
        name: course.name,
      },
      modules: orderedModules,
    });
  } catch (error) {
    return handleError(
      res,
      error,
      'No se pudieron consultar los contenidos.'
    );
  }
};

// PUT /api/teachers/me/courses/:courseId/modules/:moduleId/content
const updateTeachingModuleContent = async (
  req,
  res
) => {
  try {
    const courseId = getId(req.params.courseId);
    const moduleId = getId(req.params.moduleId);
    const body = req.body;

    if (!courseId || !moduleId) {
      return res.status(400).json({
        message:
          'Los identificadores enviados no son válidos.',
      });
    }

    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body)
    ) {
      return res.status(400).json({
        message: 'Los datos no son válidos.',
      });
    }

    const fields = Object.keys(body);

    if (
      fields.length !== 1 ||
      fields[0] !== 'description'
    ) {
      return res.status(400).json({
        message:
          'Solo puedes actualizar la descripción del módulo. Los nombres y la estructura los administra el director.',
      });
    }

    if (
      typeof body.description !== 'string' ||
      body.description.length > 20000
    ) {
      return res.status(400).json({
        message:
          'La descripción debe ser texto de hasta 20000 caracteres.',
      });
    }

    const updated =
      await sequelize.transaction(
        async (transaction) => {
          await checkAssignment({
            userId: req.user.id,
            courseId,
            transaction,
          });

          // Comprobar también que el módulo
          // pertenece al curso autorizado.
          const module = await Module.findOne({
            where: {
              id: moduleId,
              courseId,
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
          });

          if (!module) {
            throw httpError(
              404,
              'Módulo no encontrado en este curso.'
            );
          }

          await module.update(
            {
              description:
                body.description.trim(),
            },
            { transaction }
          );

          return {
            id: module.id,
            courseId: module.courseId,
            title: module.title,
            description: module.description,
            order_number: module.order_number,
          };
        }
      );

    return res.status(200).json(updated);
  } catch (error) {
    return handleError(
      res,
      error,
      'No se pudo actualizar el contenido del módulo.'
    );
  }
};

module.exports = {
  getTeachingContent,
  updateTeachingModuleContent,
};