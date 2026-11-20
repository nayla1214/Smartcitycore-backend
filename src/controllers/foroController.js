const {
  Foro,
  ForoComment,
  User,
  Video,
  VideoProgress,
  Evaluation,
  EvaluationAttempt,
} = require('../models');

const TOPICS = {
  '1.1': {
    videoId: 1,
  },
  '1.2': {
    videoUrl: 't7Yng5_mHzw',
    previousEvaluationId: 1,
    previousTopicNumber: '1.1',
  },
  '1.3': {
    videoUrl: '1u7iqnn2Saw',
    previousEvaluationId: 2,
    previousTopicNumber: '1.2',
  },
  '1.4': {
    videoUrl: '9oOPvXQliTo',
    previousEvaluationId: 3,
    previousTopicNumber: '1.3',
  },
  '2.1': {
    videoUrl: 'Fiy6pRrVWnA',
    requiredEvaluationIds: [1, 2, 3, 4],
  },
  '2.2': {
    videoUrl: 'BNz5AHsH1nA',
    previousEvaluationId: 5,
    previousTopicNumber: '2.1',
  },
    '2.3': {
    videoUrl: 'mUOt_GcwS0E',
    previousEvaluationId: 6,
    previousTopicNumber: '2.2',
  },
    '3.1': {
    videoUrl: 'NSfKRyRV1Hw',
    previousEvaluationTitle:
      'Evaluación — Tema 2.3: Espacios urbanos (actividad práctica)',
    previousTopicNumber: '2.3',
    requiredEvaluationIds: [5, 6],
  },

  '3.2': {
    videoUrl: '8ZI89AMbYM4',
    previousEvaluationTitle:
      'Evaluación — Tema 3.1: Inteligencia artificial aplicada a servicios urbanos',
    previousTopicNumber: '3.1',
  },
  '3.3': {
  videoUrl: 'NVp5uPxsY1Y',
  previousEvaluationTitle:
    'Evaluación — Tema 3.2: Educación inteligente',
  previousTopicNumber: '3.2',
},
};

const getTopic = (req, res) => {
  const topic = TOPICS[req.params.topicNumber];

  if (!topic) {
    res.status(404).json({
      message: 'Tema no encontrado.',
    });

    return null;
  }

  return topic;
};

const getMyPost = async (req, res) => {
  const topic = getTopic(req, res);
  if (!topic) return;

  try {
    const post = await Foro.findOne({
      where: {
        userId: req.user.id,
        topicNumber: req.params.topicNumber,
      },
    });

    return res.json(post);
  } catch (error) {
    console.error('Error consultando foro:', error);

    return res.status(500).json({
      message: 'No se pudo consultar el foro.',
    });
  }
};

const getPosts = async (req, res) => {
  const topic = getTopic(req, res);
  if (!topic) return;

  try {
    const posts = await Foro.findAll({
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
          include: [
            {
              model: User,
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.json(posts);
  } catch (error) {
    console.error('Error consultando publicaciones:', error);

    return res.status(500).json({
      message:
        'No se pudieron consultar las respuestas del foro.',
    });
  }
};

const publishPost = async (req, res) => {
  const topic = getTopic(req, res);
  if (!topic) return;

  try {
    const content =
      typeof req.body.content === 'string'
        ? req.body.content.trim()
        : '';

    if (content.length < 30 || content.length > 3000) {
      return res.status(400).json({
        message:
          'Escribe una respuesta de entre 30 y 3000 caracteres.',
      });
    }

    let videoId = topic.videoId;

    if (topic.videoUrl) {
      const video = await Video.findOne({
        where: {
          url: topic.videoUrl,
        },
      });

      if (!video) {
        return res.status(404).json({
          message:
            `El video del tema ${req.params.topicNumber} no está registrado en la base de datos.`,
        });
      }

      videoId = video.id;
    }
        if (topic.previousEvaluationTitle) {
      const previousEvaluation =
        await Evaluation.findOne({
          where: {
            courseId: 1,
            title: topic.previousEvaluationTitle,
            is_final: false,
          },
        });

      if (!previousEvaluation) {
        return res.status(404).json({
          message:
            `No se encontró la evaluación del tema ${topic.previousTopicNumber}.`,
        });
      }

      const attempts =
        await EvaluationAttempt.findAll({
          where: {
            userId: req.user.id,
            passed: true,
          },
          attributes: ['evaluationId'],
        });

      const passedIds = new Set(
        attempts.map((item) =>
          Number(item.evaluationId)
        )
      );

      const requiredIds = [
        ...(topic.requiredEvaluationIds || []),
        Number(previousEvaluation.id),
      ];

      if (
        !requiredIds.every((id) =>
          passedIds.has(Number(id))
        )
      ) {
        return res.status(403).json({
          message:
            `Aprueba el tema ${topic.previousTopicNumber} y sus requisitos antes de participar en el foro ${req.params.topicNumber}.`,
        });
      }
    }
    if (topic.previousEvaluationId) {
      const previousAttempt = await EvaluationAttempt.findOne({
        where: {
          userId: req.user.id,
          evaluationId: topic.previousEvaluationId,
          passed: true,
        },
      });

      if (!previousAttempt) {
        return res.status(403).json({
          message:
            `Aprueba el tema ${topic.previousTopicNumber} antes de participar en el foro ${req.params.topicNumber}.`,
        });
      }
    }

    if (topic.requiredEvaluationIds?.length) {
      const passedAttempts = await EvaluationAttempt.findAll({
        where: {
          userId: req.user.id,
          passed: true,
        },
        attributes: ['evaluationId'],
      });

      const passedIds = new Set(
        passedAttempts.map((attempt) =>
          Number(attempt.evaluationId)
        )
      );

      const previousModulePassed =
        topic.requiredEvaluationIds.every((id) =>
          passedIds.has(Number(id))
        );

      if (!previousModulePassed) {
        return res.status(403).json({
          message:
            'Aprueba las cuatro evaluaciones del módulo 1 antes de participar en el foro 2.1.',
        });
      }
    }

    const videoProgress = await VideoProgress.findOne({
      where: {
        userId: req.user.id,
        videoId,
        is_completed: true,
      },
    });

    if (!videoProgress) {
      return res.status(403).json({
        message:
          'Termina el video antes de participar en el foro.',
      });
    }

    const existing = await Foro.findOne({
      where: {
        userId: req.user.id,
        topicNumber: req.params.topicNumber,
      },
    });

    if (existing) {
      return res.status(409).json({
        message:
          'Ya publicaste tu respuesta en este tema.',
      });
    }

    const post = await Foro.create({
      userId: req.user.id,
      topicNumber: req.params.topicNumber,
      content,
    });

    return res.status(201).json(post);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        message: 'Ya publicaste tu respuesta en este tema.',
      });
    }

    console.error('Error publicando respuesta:', error);

    return res.status(500).json({
      message: 'No se pudo publicar la respuesta.',
    });
  }
};

const publishComment = async (req, res) => {
  const topic = getTopic(req, res);
  if (!topic) return;

  try {
    const postId = Number(req.params.postId);

    if (!Number.isInteger(postId) || postId < 1) {
      return res.status(400).json({
        message: 'Publicación inválida.',
      });
    }

    const content =
      typeof req.body.content === 'string'
        ? req.body.content.trim()
        : '';

    if (content.length < 10 || content.length > 1000) {
      return res.status(400).json({
        message:
          'Escribe una sugerencia de entre 10 y 1000 caracteres.',
      });
    }

    const ownPost = await Foro.findOne({
      where: {
        userId: req.user.id,
        topicNumber: req.params.topicNumber,
      },
    });

    if (!ownPost) {
      return res.status(403).json({
        message:
          'Publica primero tu respuesta para comentar una propuesta.',
      });
    }

    const post = await Foro.findOne({
      where: {
        id: postId,
        topicNumber: req.params.topicNumber,
      },
    });

    if (!post) {
      return res.status(404).json({
        message: 'No se encontró la propuesta.',
      });
    }

    if (Number(post.userId) === Number(req.user.id)) {
      return res.status(400).json({
        message:
          'Comenta la propuesta de un compañero.',
      });
    }

    const existing = await ForoComment.findOne({
      where: {
        postId,
        userId: req.user.id,
      },
    });

    if (existing) {
      return res.status(409).json({
        message:
          'Ya comentaste esta propuesta.',
      });
    }

    const comment = await ForoComment.create({
      postId,
      userId: req.user.id,
      content,
    });

    return res.status(201).json(comment);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        message: 'Ya comentaste esta propuesta.',
      });
    }

    console.error('Error publicando comentario:', error);

    return res.status(500).json({
      message:
        'No se pudo publicar el comentario.',
    });
  }
};

module.exports = {
  getMyPost,
  getPosts,
  publishPost,
  publishComment,
};