const sharp = require('sharp');

const {
  sequelize,
  Module,
  Evaluation,
  EvaluationAttempt,
  Video,
  VideoProgress,
  Foro,
  UserCourse,
} = require('../models');

const PracticalSubmission = require(
  '../models/PracticalSubmission'
);

const TITLE =
  'Evaluación — Tema 2.3: Espacios urbanos (actividad práctica)';

const FIELDS = [
  'space',
  'problem',
  'people',
  'proposal',
  'participation',
  'result',
];

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const fail = (status, message) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};

// Localiza la evaluación práctica y comprueba el tema anterior.
async function getContext(userId) {
  const mod = await Module.findOne({
    where: {
      courseId: 1,
      order_number: 2,
    },
  });

  if (!mod) {
    fail(
      404,
      'No se encontró el módulo 2 del curso 1.'
    );
  }

  const evaluation = await Evaluation.findOne({
    where: {
      moduleId: mod.id,
      courseId: 1,
      title: TITLE,
      is_final: false,
    },
  });

  if (!evaluation) {
    fail(
      404,
      'Ejecuta primero el seeder createEvaluation23.js.'
    );
  }

  // La evaluación del tema 2.2 tiene ID 6.
  const previousAttempt = await EvaluationAttempt.findOne({
    where: {
      userId,
      evaluationId: 6,
      passed: true,
    },
  });

  if (!previousAttempt) {
    fail(
      403,
      'Aprueba el tema 2.2 antes de continuar.'
    );
  }

  return {
    mod,
    evaluation,
  };
}

// Para entregar la evaluación se exige video completo
// y una respuesta propia publicada en el foro.
// No se exige comentar a un compañero.
async function checkRequirements(userId, moduleId) {
  const video = await Video.findOne({
    where: {
      moduleId,
      url: 'mUOt_GcwS0E',
    },
  });

  const progress = video
    ? await VideoProgress.findOne({
        where: {
          userId,
          videoId: video.id,
          is_completed: true,
        },
      })
    : null;

  if (!progress) {
    fail(
      403,
      'Completa el video del tema 2.3.'
    );
  }

  const post = await Foro.findOne({
    where: {
      userId,
      topicNumber: '2.3',
    },
  });

  if (!post) {
    fail(
      403,
      'Publica tu respuesta en el foro del tema 2.3.'
    );
  }
}

// Prepara la respuesta para el frontend.
function serialize(submission, evaluationId) {
  return {
    evaluationId,
    passed: Boolean(submission),
    percentage: submission ? 100 : null,
    earnedScore: submission ? 10 : null,
    maximumScore: 10,

    submission: submission
      ? {
          id: submission.id,
          answers: submission.answers,

          imageDataUrl:
            'data:image/jpeg;base64,' +
            Buffer.from(submission.image).toString('base64'),

          createdAt: submission.createdAt,
        }
      : null,
  };
}

function sendError(res, error) {
  if (!error.status) {
    console.error(
      'Error en evaluación práctica:',
      error
    );
  }

  return res.status(error.status || 500).json({
    message: error.status
      ? error.message
      : 'No se pudo guardar o consultar la actividad. Intenta nuevamente.',
  });
}

// GET /api/evaluations/practical/2.3
// Recupera exclusivamente la entrega del usuario autenticado.
const getPracticalEvaluation = async (req, res) => {
  try {
    const { evaluation } = await getContext(req.user.id);

    const submission = await PracticalSubmission.findOne({
      where: {
        userId: req.user.id,
        evaluationId: evaluation.id,
      },
    });

    return res.json(
      serialize(submission, evaluation.id)
    );
  } catch (error) {
    return sendError(res, error);
  }
};

// POST /api/evaluations/practical/2.3
const submitPracticalEvaluation = async (req, res) => {
  try {
    const userId = req.user.id;

    const { mod, evaluation } = await getContext(userId);

    await checkRequirements(userId, mod.id);

    const existing = await PracticalSubmission.findOne({
      where: {
        userId,
        evaluationId: evaluation.id,
      },
    });

    // Si la entrega ya existe, se devuelve sin crear otra nota.
    if (existing) {
      return res.json(
        serialize(existing, evaluation.id)
      );
    }

    const answers = {};

    for (const field of FIELDS) {
      const value =
        typeof req.body.answers?.[field] === 'string'
          ? req.body.answers[field].trim()
          : '';

      if (!value || value.length > 2000) {
        fail(
          400,
          'Completa las seis respuestas. Cada una admite hasta 2000 caracteres.'
        );
      }

      answers[field] = value;
    }

    const dataUrl = req.body.imageDataUrl;

    if (
      typeof dataUrl !== 'string' ||
      dataUrl.length > 2800000
    ) {
      fail(
        400,
        'Adjunta una imagen JPG, PNG o WEBP de hasta 2 MB.'
      );
    }

    const match =
      /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(
        dataUrl
      );

    if (!match) {
      fail(
        400,
        'Adjunta una imagen JPG, PNG o WEBP válida.'
      );
    }

    const input = Buffer.from(match[2], 'base64');

    if (
      !input.length ||
      input.length > MAX_IMAGE_BYTES
    ) {
      fail(
        400,
        'La imagen debe pesar como máximo 2 MB.'
      );
    }

    let image;

    try {
      const options = {
        limitInputPixels: 20000000,
        failOn: 'warning',
      };

      const metadata = await sharp(
        input,
        options
      ).metadata();

      if (
        !['jpeg', 'png', 'webp'].includes(metadata.format) ||
        (metadata.pages || 1) !== 1
      ) {
        fail(
          400,
          'Adjunta una fotografía estática JPG, PNG o WEBP.'
        );
      }

      image = await sharp(input, options)
        .rotate()
        .resize({
          width: 1200,
          height: 1200,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({
          quality: 82,
        })
        .toBuffer();
    } catch (error) {
      if (error.status) {
        throw error;
      }

      fail(
        400,
        'No se pudo leer la imagen. Elige otra fotografía JPG, PNG o WEBP.'
      );
    }

    // La entrega y su nota se guardan juntas.
    // Si ocurre un error, no queda una aprobación incompleta.
    const submission = await sequelize.transaction(
      async (transaction) => {
        await Evaluation.findByPk(evaluation.id, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        const saved = await PracticalSubmission.findOne({
          where: {
            userId,
            evaluationId: evaluation.id,
          },
          transaction,
        });

        if (saved) {
          return saved;
        }

        const created = await PracticalSubmission.create(
          {
            userId,
            evaluationId: evaluation.id,
            answers,
            image,
          },
          {
            transaction,
          }
        );

        // La nota se asigna aquí, en el servidor.
        await EvaluationAttempt.create(
          {
            userId,
            evaluationId: evaluation.id,
            score: 100,
            passed: true,
          },
          {
            transaction,
          }
        );

        await UserCourse.findOrCreate({
          where: {
            userId,
            courseId: mod.courseId,
          },

          defaults: {
            userId,
            courseId: mod.courseId,
          },

          transaction,
        });

        return created;
      }
    );

    return res.status(201).json(
      serialize(submission, evaluation.id)
    );
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  getPracticalEvaluation,
  submitPracticalEvaluation,
};