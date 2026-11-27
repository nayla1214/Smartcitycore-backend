const {
  sequelize,
  User,
  Course,
  Module,
  CourseTeacher,
} = require('../models');

const validId = (value) => {
  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0
    ? id
    : null;
};

const serverError = (res, error, message) => {
  console.error(message, error);

  return res.status(500).json({ message });
};

// ADMIN: consultar docentes activos para asignarlos.
const getAvailableTeachers = async (req, res) => {
  try {
    const teachers = await User.findAll({
      where: {
        role: 'DOCENTE',
        status: true,
      },
      attributes: ['id', 'name', 'email'],
      order: [['name', 'ASC']],
    });

    return res.status(200).json(teachers);
  } catch (error) {
    return serverError(
      res,
      error,
      'No se pudieron consultar los docentes.'
    );
  }
};

// ADMIN: consultar las asignaciones de un curso.
const getCourseTeachers = async (req, res) => {
  const courseId = validId(req.params.courseId);

  if (!courseId) {
    return res.status(400).json({
      message: 'El identificador del curso no es válido.',
    });
  }

  try {
    const course = await Course.findByPk(courseId);

    if (!course) {
      return res.status(404).json({
        message: 'Curso no encontrado.',
      });
    }

    const assignments = await CourseTeacher.findAll({
      where: { courseId },
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: [
            'id',
            'name',
            'email',
            'role',
            'status',
          ],
        },
      ],
      order: [['id', 'ASC']],
    });

    return res.status(200).json(assignments);
  } catch (error) {
    return serverError(
      res,
      error,
      'No se pudieron consultar las asignaciones.'
    );
  }
};

// ADMIN: asignar un docente a un curso.
// Repetir la solicitud no duplica la asignación.
const assignTeacher = async (req, res) => {
  const courseId = validId(req.params.courseId);
  const userId = validId(req.body?.userId);

  if (!courseId || !userId) {
    return res.status(400).json({
      message:
        'Selecciona un curso y un docente válidos.',
    });
  }

  try {
    const result = await sequelize.transaction(
      async (transaction) => {
        const user = await User.findByPk(userId, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (!user) {
          return {
            status: 404,
            body: { message: 'Docente no encontrado.' },
          };
        }

        if (
          user.role !== 'DOCENTE' ||
          user.status !== true
        ) {
          return {
            status: 400,
            body: {
              message:
                'La cuenta debe ser un docente activo.',
            },
          };
        }

        const course = await Course.findByPk(
          courseId,
          {
            transaction,
            lock: transaction.LOCK.UPDATE,
          }
        );

        if (!course) {
          return {
            status: 404,
            body: { message: 'Curso no encontrado.' },
          };
        }

        if (course.status !== true) {
          return {
            status: 409,
            body: {
              message:
                'Activa el curso antes de asignar docentes.',
            },
          };
        }

        const [assignment, created] =
          await CourseTeacher.findOrCreate({
            where: { userId, courseId },
            defaults: { userId, courseId },
            transaction,
          });

        return {
          status: created ? 201 : 200,
          body: {
            message: created
              ? 'Docente asignado correctamente.'
              : 'El docente ya estaba asignado al curso.',
            assignment,
          },
        };
      }
    );

    return res.status(result.status).json(result.body);
  } catch (error) {
    return serverError(
      res,
      error,
      'No se pudo asignar el docente.'
    );
  }
};

// ADMIN: retirar la asignación.
// Conserva la cuenta, el curso y sus actividades.
const removeTeacher = async (req, res) => {
  const courseId = validId(req.params.courseId);
  const userId = validId(req.params.userId);

  if (!courseId || !userId) {
    return res.status(400).json({
      message:
        'Los identificadores enviados no son válidos.',
    });
  }

  try {
    const removed = await CourseTeacher.destroy({
      where: { courseId, userId },
    });

    if (!removed) {
      return res.status(404).json({
        message: 'La asignación no existe.',
      });
    }

    return res.status(200).json({
      message: 'Asignación retirada correctamente.',
    });
  } catch (error) {
    return serverError(
      res,
      error,
      'No se pudo retirar la asignación.'
    );
  }
};

// DOCENTE: consultar únicamente sus cursos activos.
const getMyTeachingCourses = async (req, res) => {
  try {
    const assignments = await CourseTeacher.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Course,
          as: 'course',
          required: true,
          where: { status: true },
          include: [
            {
              model: Module,
              attributes: [
                'id',
                'title',
                'order_number',
              ],
            },
          ],
        },
      ],
      order: [['id', 'ASC']],
    });

    const courses = assignments.map((assignment) => {
      const course = assignment.course.toJSON();

      course.Modules = (course.Modules || []).sort(
        (first, second) =>
          Number(first.order_number) -
          Number(second.order_number)
      );

      return course;
    });

    return res.status(200).json(courses);
  } catch (error) {
    return serverError(
      res,
      error,
      'No se pudieron consultar tus cursos asignados.'
    );
  }
};

// DOCENTE: editar información de un curso asignado.
// No permite cambiar el estado del curso.
const updateMyTeachingCourse = async (req, res) => {
  const courseId = validId(req.params.courseId);
  const body = req.body;

  if (!courseId) {
    return res.status(400).json({
      message: 'El identificador del curso no es válido.',
    });
  }

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
    'name',
    'description',
    'image_url',
  ];

  if (
    Object.keys(body).some(
      (key) => !allowedFields.includes(key)
    )
  ) {
    return res.status(400).json({
      message:
        'Solo puedes editar el nombre, la descripción y la imagen.',
    });
  }

  const changes = {};

  if (body.name !== undefined) {
    if (
      typeof body.name !== 'string' ||
      !body.name.trim() ||
      body.name.trim().length > 255
    ) {
      return res.status(400).json({
        message:
          'Ingresa un nombre de curso de hasta 255 caracteres.',
      });
    }

    changes.name = body.name.trim();
  }

  if (body.description !== undefined) {
    if (
      body.description !== null &&
      typeof body.description !== 'string'
    ) {
      return res.status(400).json({
        message: 'La descripción no es válida.',
      });
    }

    changes.description =
      body.description === null
        ? null
        : body.description.trim();
  }

  if (body.image_url !== undefined) {
    if (
      body.image_url !== null &&
      typeof body.image_url !== 'string'
    ) {
      return res.status(400).json({
        message: 'La imagen no es válida.',
      });
    }

    const imageUrl = body.image_url?.trim() || null;

    if (imageUrl && imageUrl.length > 255) {
      return res.status(400).json({
        message:
          'La dirección de la imagen supera los 255 caracteres.',
      });
    }

    changes.image_url = imageUrl;
  }

  if (!Object.keys(changes).length) {
    return res.status(400).json({
      message: 'Envía al menos un campo para actualizar.',
    });
  }

  try {
    const result = await sequelize.transaction(
      async (transaction) => {
        // Bloquear la asignación impide que se retire
        // mientras se está autorizando esta edición.
        const assignment =
          await CourseTeacher.findOne({
            where: {
              userId: req.user.id,
              courseId,
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
          });

        if (!assignment) {
          return {
            status: 403,
            body: {
              message:
                'No tienes este curso asignado.',
            },
          };
        }

        const course = await Course.findByPk(
          courseId,
          {
            transaction,
            lock: transaction.LOCK.UPDATE,
          }
        );

        if (!course || course.status !== true) {
          return {
            status: 404,
            body: {
              message: 'El curso no está disponible.',
            },
          };
        }

        await course.update(changes, { transaction });

        return {
          status: 200,
          body: course.toJSON(),
        };
      }
    );

    return res.status(result.status).json(result.body);
  } catch (error) {
    return serverError(
      res,
      error,
      'No se pudo actualizar el curso.'
    );
  }
};

module.exports = {
  getAvailableTeachers,
  getCourseTeachers,
  assignTeacher,
  removeTeacher,
  getMyTeachingCourses,
  updateMyTeachingCourse,
};