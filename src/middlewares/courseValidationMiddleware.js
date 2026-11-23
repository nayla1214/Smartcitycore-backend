const { Course } = require('../models');

const has = (object, key) =>
  Object.prototype.hasOwnProperty.call(object, key);

const validId = (value) => {
  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0;
};

const validateResourceId = (req, res, next) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({
      message: 'El identificador no es válido.',
    });
  }

  return next();
};

const validateCourseWrite = (req, res, next) => {
  const body = req.body || {};
  const creating = req.method === 'POST';

  if (creating || has(body, 'name')) {
    if (
      typeof body.name !== 'string' ||
      !body.name.trim() ||
      body.name.trim().length > 255
    ) {
      return res.status(400).json({
        message:
          'Escribe un nombre de curso de entre 1 y 255 caracteres.',
      });
    }

    body.name = body.name.trim();
  }

  if (has(body, 'description')) {
    if (typeof body.description !== 'string') {
      return res.status(400).json({
        message: 'La descripción debe ser un texto.',
      });
    }

    body.description = body.description.trim();
  }

  if (has(body, 'image_url')) {
    if (
      typeof body.image_url !== 'string' ||
      body.image_url.trim().length > 255
    ) {
      return res.status(400).json({
        message:
          'La dirección de la imagen debe tener como máximo 255 caracteres.',
      });
    }

    body.image_url = body.image_url.trim();

    if (body.image_url) {
      try {
        const url = new URL(body.image_url);

        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new Error('Protocolo inválido');
        }
      } catch {
        return res.status(400).json({
          message:
            'Ingresa una dirección de imagen HTTP o HTTPS válida.',
        });
      }
    }
  }

  if (
    has(body, 'status') &&
    typeof body.status !== 'boolean'
  ) {
    return res.status(400).json({
      message: 'El estado debe ser true o false.',
    });
  }

  if (creating && !has(body, 'status')) {
    body.status = true;
  }

  return next();
};

const validateModuleWrite = async (req, res, next) => {
  const body = req.body || {};
  const creating = req.method === 'POST';

  if (creating || has(body, 'title')) {
    if (
      typeof body.title !== 'string' ||
      !body.title.trim() ||
      body.title.trim().length > 255
    ) {
      return res.status(400).json({
        message:
          'Escribe un título de módulo de entre 1 y 255 caracteres.',
      });
    }

    body.title = body.title.trim();
  }

  if (has(body, 'description')) {
    if (typeof body.description !== 'string') {
      return res.status(400).json({
        message: 'La descripción debe ser un texto.',
      });
    }

    body.description = body.description.trim();
  }

  if (creating || has(body, 'order_number')) {
    if (!validId(body.order_number)) {
      return res.status(400).json({
        message:
          'El número de módulo debe ser un entero mayor que cero.',
      });
    }

    body.order_number = Number(body.order_number);
  }

  if (
    has(body, 'status') &&
    typeof body.status !== 'boolean'
  ) {
    return res.status(400).json({
      message: 'El estado debe ser true o false.',
    });
  }

  if (!creating) return next();

  if (!validId(body.courseId)) {
    return res.status(400).json({
      message: 'El curso seleccionado no es válido.',
    });
  }

  try {
    const course = await Course.findByPk(body.courseId);

    if (!course) {
      return res.status(404).json({
        message: 'El curso no existe.',
      });
    }

    body.courseId = Number(body.courseId);

    if (!has(body, 'status')) {
      body.status = true;
    }

    return next();
  } catch (error) {
    console.error('Error validando módulo:', error);

    return res.status(500).json({
      message: 'No se pudo validar el curso.',
    });
  }
};

module.exports = {
  validateResourceId,
  validateCourseWrite,
  validateModuleWrite,
};