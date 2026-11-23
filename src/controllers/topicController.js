const {
  Topic,
  Module,
} = require('../models');

const getPositiveId = (value) => {
  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0
    ? id
    : null;
};

const validateContent = (body) => {
  if (
    typeof body?.title !== 'string' ||
    !body.title.trim() ||
    body.title.trim().length > 255
  ) {
    return 'Escribe un título de entre 1 y 255 caracteres.';
  }

  if (
    typeof body.introduction !== 'string' ||
    body.introduction.length > 20000
  ) {
    return 'El contenido inicial debe ser un texto de hasta 20000 caracteres.';
  }

  return null;
};

// GET /api/modules/:id/topics
const getTopicsByModule = async (req, res) => {
  try {
    const moduleId = getPositiveId(req.params.id);

    if (!moduleId) {
      return res.status(400).json({
        message: 'El módulo no es válido.',
      });
    }

    const moduleItem = await Module.findByPk(moduleId);

    if (!moduleItem) {
      return res.status(404).json({
        message: 'Módulo no encontrado.',
      });
    }

    const topics = await Topic.findAll({
      where: {
        moduleId,
      },
      attributes: [
        'id',
        'moduleId',
        'topicNumber',
        'title',
        'introduction',
        'order_number',
        'updatedAt',
      ],
      order: [
        ['order_number', 'ASC'],
        ['id', 'ASC'],
      ],
    });

    return res.status(200).json(topics);
  } catch (error) {
    console.error('Error consultando temas:', error);

    return res.status(500).json({
      message: 'No se pudieron consultar los temas.',
    });
  }
};

// POST /api/modules/:id/topics
// Solo administrador tutor.
const createTopic = async (req, res) => {
  try {
    const moduleId = getPositiveId(req.params.id);

    if (!moduleId) {
      return res.status(400).json({
        message: 'El módulo no es válido.',
      });
    }

    const validationError = validateContent(req.body);

    if (validationError) {
      return res.status(400).json({
        message: validationError,
      });
    }

    const result = await Topic.sequelize.transaction(
      async (transaction) => {
        // Bloquea el módulo para que dos creaciones
        // simultáneas no reciban el mismo número.
        const moduleItem = await Module.findByPk(
          moduleId,
          {
            transaction,
            lock: transaction.LOCK.UPDATE,
          }
        );

        if (!moduleItem) {
          return {
            status: 404,
            message: 'Módulo no encontrado.',
          };
        }

        /*
         * El curso original utiliza una secuencia
         * académica fija de 10 temas.
         * Sus temas existentes pueden editarse.
         */
        if (Number(moduleItem.courseId) === 1) {
          return {
            status: 409,
            message:
              'El curso original conserva sus 10 temas y sus requisitos actuales. Puedes editar esos temas. La creación de temas adicionales se habilitará al adaptar su seguimiento académico.',
          };
        }

        const moduleNumber = Number(
          moduleItem.order_number
        );

        if (
          !Number.isSafeInteger(moduleNumber) ||
          moduleNumber < 1
        ) {
          return {
            status: 400,
            message:
              'El módulo no tiene un número válido.',
          };
        }

        const lastTopic = await Topic.findOne({
          where: {
            moduleId,
          },
          order: [['order_number', 'DESC']],
          transaction,
        });

        const nextOrder =
          Number(lastTopic?.order_number || 0) + 1;

        const topicNumber =
          `${moduleNumber}.${nextOrder}`;

        const topic = await Topic.create(
          {
            moduleId,
            topicNumber,
            order_number: nextOrder,
            title: req.body.title.trim(),
            introduction:
              req.body.introduction.trim(),
          },
          {
            transaction,
          }
        );

        return {
          status: 201,
          message: 'Tema creado correctamente.',
          topic,
        };
      }
    );

    return res.status(result.status).json({
      message: result.message,
      ...(result.topic
        ? { topic: result.topic }
        : {}),
    });
  } catch (error) {
    console.error('Error creando tema:', error);

    if (
      error.name === 'SequelizeUniqueConstraintError'
    ) {
      return res.status(409).json({
        message:
          'Ese número de tema ya está registrado. Actualiza la lista e inténtalo nuevamente.',
      });
    }

    return res.status(500).json({
      message: 'No se pudo crear el tema.',
    });
  }
};

// PUT /api/modules/:id/topics/:topicId
// Solo administrador tutor.
const updateTopic = async (req, res) => {
  try {
    const moduleId = getPositiveId(req.params.id);

    const topicId = getPositiveId(
      req.params.topicId
    );

    if (!moduleId || !topicId) {
      return res.status(400).json({
        message:
          'El identificador del módulo o del tema no es válido.',
      });
    }

    const validationError = validateContent(req.body);

    if (validationError) {
      return res.status(400).json({
        message: validationError,
      });
    }

    const topic = await Topic.findOne({
      where: {
        id: topicId,
        moduleId,
      },
    });

    if (!topic) {
      return res.status(404).json({
        message:
          'El tema no existe en el módulo seleccionado.',
      });
    }

    await topic.update({
      title: req.body.title.trim(),
      introduction: req.body.introduction.trim(),
    });

    return res.status(200).json({
      message: 'Tema actualizado correctamente.',
      topic,
    });
  } catch (error) {
    console.error('Error actualizando tema:', error);

    return res.status(500).json({
      message: 'No se pudo actualizar el tema.',
    });
  }
};

module.exports = {
  getTopicsByModule,
  createTopic,
  updateTopic,
};