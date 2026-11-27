const { randomUUID } = require('node:crypto');
const { Op } = require('sequelize');

const {
  sequelize,
  User,
  Course,
  Module,
  Video,
  VideoProgress,
  Evaluation,
  EvaluationAttempt,
  UserCourse,
  Certificate,
} = require('../models');

const ReadingProgress = require('../models/ReadingProgress');
const readingCatalog = require('../data/readingCatalog.json');

const {
  buildModuleProgress,
} = require('./moduleProgress');

const DEFINITIONS = [
  {
    order: 1,
    topics: ['1.1', '1.2', '1.3', '1.4'],
    integrativeWeight: 1.6,
  },
  {
    order: 2,
    topics: ['2.1', '2.2', '2.3'],
    integrativeWeight: 1.2,
  },
  {
    order: 3,
    topics: ['3.1', '3.2', '3.3'],
    integrativeWeight: 1.2,
  },
];

const fail = (status, message) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};

const validScore = (value) => {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ''
  ) {
    return null;
  }

  const score = Number(value);

  return Number.isFinite(score) &&
    score >= 0 &&
    score <= 100
    ? score
    : null;
};

const consolidateVideoProgress = (rows) => {
  const grouped = new Map();

  for (const row of rows) {
    const id = Number(row.videoId);
    const previous = grouped.get(id);

    grouped.set(id, {
      ...row,
      is_completed:
        previous?.is_completed === true ||
        row.is_completed === true,

      percentage: Math.max(
        Number(previous?.percentage) || 0,
        Number(row.percentage) || 0
      ),
    });
  }

  return [...grouped.values()];
};

const issueCourseCertificate = async (userId, courseId) => {
  // Estas reglas académicas corresponden al curso 1.
  if (Number(courseId) !== 1) {
    fail(
      409,
      'La emisión todavía no está configurada para este curso.'
    );
  }

  return sequelize.transaction(async (transaction) => {
    // Serializa solicitudes repetidas del mismo participante.
    const user = await User.findByPk(userId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!user || !user.status) {
      fail(403, 'La cuenta no está disponible.');
    }

    if (user.role !== 'USER') {
      fail(
        403,
        'La emisión corresponde a cuentas de participantes.'
      );
    }

    const certificates = await Certificate.findAll({
      where: { userId, courseId },
      order: [['id', 'ASC']],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    const issued = certificates.find(
      (item) => item.issued_snapshot?.version === 1
    );

    // Un certificado emitido conserva sus datos originales.
    if (issued) return issued;

    const enrollment = await UserCourse.findOne({
      where: { userId, courseId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!enrollment) {
      fail(409, 'Primero debes iniciar el curso.');
    }

    const course = await Course.findByPk(courseId, {
      include: [
        {
          model: Module,
          include: [{ model: Video }],
        },
      ],
      transaction,
    });

    if (!course) {
      fail(404, 'Curso no encontrado.');
    }

    const modules = course.Modules || [];

    if (
      modules.length !== 3 ||
      !DEFINITIONS.every(
        (definition) =>
          modules.filter(
            (module) =>
              Number(module.order_number) ===
              definition.order
          ).length === 1
      )
    ) {
      fail(
        409,
        'La estructura del curso debe contener sus tres módulos configurados.'
      );
    }

    const videoIds = modules.flatMap((module) =>
      (module.Videos || []).map((video) => video.id)
    );

    const allEvaluations = await Evaluation.findAll({
      where: { courseId },
      transaction,
    });

    const evaluationIds = allEvaluations.map(
      (evaluation) => evaluation.id
    );

    const evaluationAttempts =
      evaluationIds.length > 0
        ? await EvaluationAttempt.findAll({
            where: {
              userId,
              evaluationId: {
                [Op.in]: evaluationIds,
              },
            },
            transaction,
          })
        : [];

    const videoRows =
      videoIds.length > 0
        ? await VideoProgress.findAll({
            where: {
              userId,
              videoId: { [Op.in]: videoIds },
            },
            raw: true,
            transaction,
          })
        : [];

    const readings = await ReadingProgress.findAll({
      where: { userId },
      raw: true,
      transaction,
    });

    const videoProgress =
      consolidateVideoProgress(videoRows);

    let finalScore = 0;
    const breakdown = [];

    for (const definition of DEFINITIONS) {
      const module = modules.find(
        (item) =>
          Number(item.order_number) === definition.order
      );

      const detail = buildModuleProgress({
        module,
        courseId,
        evaluationAttempts,
        allEvaluations,
        videoProgress,
        readings,
        readingCatalog,
      });

      if (!detail.supported || detail.completed !== true) {
        fail(
          409,
          `Completa los videos, las lecturas y las evaluaciones del módulo ${definition.order}.`
        );
      }

      let points = 0;

      for (const topic of definition.topics) {
        const evaluation = detail.evaluations.find(
          (item) => item.topic === topic
        );

        const score = validScore(evaluation?.bestScore);

        if (
          !evaluation?.id ||
          !evaluation.passed ||
          score === null ||
          score < 70
        ) {
          fail(
            409,
            `Debes aprobar la evaluación del tema ${topic}.`
          );
        }

        points += (score / 100) * 0.6;
      }

      const integrativeScore = validScore(
        detail.integrative?.bestScore
      );

      if (
        !detail.integrative?.id ||
        !detail.integrative.passed ||
        integrativeScore === null ||
        integrativeScore < 70
      ) {
        fail(
          409,
          `Debes aprobar la integradora del módulo ${definition.order}.`
        );
      }

      points +=
        (integrativeScore / 100) *
        definition.integrativeWeight;

      finalScore += points;

      breakdown.push({
        order: definition.order,
        points: Number(points.toFixed(4)),
      });
    }

    finalScore = Number(finalScore.toFixed(2));

    const participantName = String(user.name || '').trim();
    const courseName = String(course.name || '').trim();

    if (!participantName || !courseName) {
      fail(
        409,
        'Falta el nombre del participante o del curso.'
      );
    }

    const values = {
      userId,
      courseId,
      issue_date: new Date(),

      issued_snapshot: {
        version: 1,
        participantName,
        courseName,
        finalScore,
        scoreScale: 10,
        modules: breakdown,
      },
    };

    // Reutiliza un registro antiguo sin considerar
    // su fecha anterior como una emisión válida.
    const legacy = certificates[0];

    let certificate;

    if (legacy) {
      certificate = await legacy.update(
        {
          ...values,
          unique_code: legacy.unique_code || randomUUID(),
        },
        { transaction }
      );
    } else {
      certificate = await Certificate.create(
        {
          ...values,
          unique_code: randomUUID(),
        },
        { transaction }
      );
    }

    // Conserva final_score en escala porcentual
    // para los componentes existentes.
    await enrollment.update(
      {
        is_completed: true,
        final_score: finalScore * 10,
      },
      { transaction }
    );

    return certificate;
  });
};

module.exports = {
  issueCourseCertificate,
};