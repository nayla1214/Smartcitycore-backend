const { Op } = require('sequelize');

const ReadingProgress = require('../models/ReadingProgress');
const readingCatalog = require('../data/readingCatalog.json');

const {
  buildModuleProgress,
} = require('../services/moduleProgress');

const {
  User,
  UserCourse,
  Course,
  Module,
  Video,
  VideoProgress,
  Evaluation,
  EvaluationAttempt,
} = require('../models');

// Consultar todos los usuarios.
const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: {
        exclude: ['password'],
      },
    });

    return res.status(200).json(users);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error al consultar los usuarios',
    });
  }
};

// Actualizar el perfil del usuario autenticado.
const updateProfile = async (req, res) => {
  try {
    const name =
      typeof req.body.name === 'string'
        ? req.body.name.trim()
        : '';

    const email =
      typeof req.body.email === 'string'
        ? req.body.email.trim().toLowerCase()
        : '';

    if (!name || !email) {
      return res.status(400).json({
        message: 'El nombre y el correo son obligatorios',
      });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return res.status(400).json({
        message: 'Ingresa un correo electrónico válido',
      });
    }

    const existingUser = await User.findOne({
      where: {
        email,
        id: {
          [Op.ne]: req.user.id,
        },
      },
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'Este correo electrónico ya está registrado',
      });
    }

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: 'Usuario no encontrado',
      });
    }

    user.name = name;
    user.email = email;

    await user.save();

    return res.status(200).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error('Error al actualizar el perfil:', error);

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        message: 'Este correo electrónico ya está registrado',
      });
    }

    return res.status(500).json({
      message: 'No se pudo actualizar el perfil',
    });
  }
};

// Actualizar el estado de un usuario.
const updateUserStatus = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: 'Usuario no encontrado',
      });
    }

    user.status = req.body.status;
    await user.save();

    return res.status(200).json({
      message: 'Estado del usuario actualizado',
      user: {
        id: user.id,
        status: user.status,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error al actualizar el usuario',
    });
  }
};

// Consultar un usuario con sus cursos.
// Se conserva el historial para la administración.
const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: {
        exclude: ['password'],
      },
      include: [
        {
          model: UserCourse,
          include: [Course],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        message: 'Usuario no encontrado',
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error al consultar el usuario',
    });
  }
};

// Consultar el avance del usuario autenticado.
// El resumen considera solamente cursos activos.
const getMyProgress = async (req, res) => {
  try {
    const userId = req.user.id;

    const isAdmin = ['ADMIN', 'SUPERADMIN'].includes(
      req.user.role
    );

    const [
      enrollmentRows,
      videoProgress,
      allUserAttempts,
    ] = await Promise.all([
      UserCourse.findAll({
        where: { userId },
        include: [
          {
            model: Course,

            // Excluye cursos desactivados o inexistentes.
            required: true,
            where: { status: true },

            attributes: [
              'id',
              'name',
              'description',
              'image_url',
            ],

            include: [
              {
                model: Module,
                attributes: [
                  'id',
                  'title',
                  'order_number',
                ],
                include: [
                  {
                    model: Video,
                    attributes: [
                      'id',
                      'title',
                      'duration',
                    ],
                  },
                ],
              },
            ],
          },
        ],
        order: [['updatedAt', 'DESC']],
      }),

      VideoProgress.findAll({
        where: { userId },
        include: [
          {
            model: Video,
            attributes: ['id', 'title', 'moduleId'],
            include: [
              {
                model: Module,
                attributes: ['id', 'title', 'courseId'],
                include: [
                  {
                    model: Course,
                    attributes: ['id', 'name'],
                  },
                ],
              },
            ],
          },
        ],
        order: [['updatedAt', 'DESC']],
      }),

      EvaluationAttempt.findAll({
        where: { userId },
        include: [
          {
            model: Evaluation,
            attributes: [
              'id',
              'title',
              'moduleId',
              'courseId',
              'is_final',
            ],
            include: [
              {
                model: Course,
                attributes: ['id', 'name'],
              },
            ],
          },
        ],
        order: [['attempted_at', 'DESC']],
      }),
    ]);

    // Evita contar dos veces un curso si hubiera
    // inscripciones repetidas.
    const userCourses = [
      ...new Map(
        enrollmentRows
          .filter((row) => row.Course)
          .map((row) => [
            Number(row.Course.id),
            row,
          ])
          .reverse()
      ).values(),
    ];

    const activeCourseIds = new Set(
      userCourses.map((row) => Number(row.Course.id))
    );

    const [allEvaluations, readings] = await Promise.all([
      activeCourseIds.size > 0
        ? Evaluation.findAll({
            where: {
              courseId: {
                [Op.in]: [...activeCourseIds],
              },
            },
            attributes: [
              'id',
              'title',
              'moduleId',
              'courseId',
              'is_final',
            ],
          })
        : Promise.resolve([]),

      ReadingProgress.findAll({
        where: { userId },
        raw: true,
      }),
    ]);

    const evaluationAttempts = allUserAttempts.filter(
      (attempt) =>
        activeCourseIds.has(
          Number(attempt.Evaluation?.courseId)
        )
    );

    const courseVideoIds = new Set(
      userCourses.flatMap((enrollment) =>
        (enrollment.Course.Modules || []).flatMap(
          (module) =>
            (module.Videos || []).map(
              (video) => Number(video.id)
            )
        )
      )
    );

    // Consolida posibles registros repetidos de videos.
    const progressByVideo = new Map();

    for (const row of videoProgress) {
      const videoId = Number(row.videoId);

      if (!courseVideoIds.has(videoId)) continue;

      const item =
        typeof row.get === 'function'
          ? row.get({ plain: true })
          : { ...row };

      const previous = progressByVideo.get(videoId);

      if (!previous) {
        progressByVideo.set(videoId, item);
      } else {
        progressByVideo.set(videoId, {
          ...previous,

          is_completed:
            previous.is_completed === true ||
            item.is_completed === true,

          percentage: Math.max(
            Number(previous.percentage) || 0,
            Number(item.percentage) || 0
          ),

          time_watched: Math.max(
            Number(previous.time_watched) || 0,
            Number(item.time_watched) || 0
          ),
        });
      }
    }

    const currentVideoProgress = [
      ...progressByVideo.values(),
    ];

    let totalModules = 0;
    let completedModules = 0;

    const courses = userCourses.map((userCourse) => {
      const course = userCourse.Course;
      const modules = course.Modules || [];

      totalModules += modules.length;

      const courseVideos = [
        ...new Map(
          modules
            .flatMap((module) => module.Videos || [])
            .map((video) => [Number(video.id), video])
        ).values(),
      ];

      const completedVideos = courseVideos.filter(
        (video) =>
          progressByVideo.get(Number(video.id))
            ?.is_completed === true
      ).length;

      const accumulatedVideoProgress =
        courseVideos.reduce((total, video) => {
          const progress = progressByVideo.get(
            Number(video.id)
          );

          const percentage = progress?.is_completed
            ? 100
            : Math.max(
                0,
                Math.min(
                  100,
                  Number(progress?.percentage) || 0
                )
              );

          return total + percentage;
        }, 0);

      const videoPercentage =
        courseVideos.length > 0
          ? Math.round(
              accumulatedVideoProgress /
                courseVideos.length
            )
          : 0;

      const completedVideoModules = modules.filter(
        (module) => {
          const videos = module.Videos || [];

          return (
            videos.length > 0 &&
            videos.every(
              (video) =>
                progressByVideo.get(Number(video.id))
                  ?.is_completed === true
            )
          );
        }
      ).length;

      const moduleDetails = modules
        .map((module) =>
          buildModuleProgress({
            module,
            courseId: course.id,
            evaluationAttempts,
            allEvaluations,
            videoProgress: currentVideoProgress,
            readings,
            readingCatalog,
          })
        )
        .sort((first, second) => first.order - second.order);

      const isSmartCityCourse = Number(course.id) === 1;

      const approvedCourseModules = isSmartCityCourse
        ? moduleDetails.filter(
            (module) =>
              module.supported &&
              module.evaluations.length > 0 &&
              module.evaluations.every(
                (evaluation) => evaluation.passed
              ) &&
              module.integrative.passed
          ).length
        : completedVideoModules;

      completedModules += approvedCourseModules;

      // El curso 1 solo está completo cuando sus
      // tres módulos cumplen todos los requisitos.
      const smartCityCompleted =
        moduleDetails.length === 3 &&
        [1, 2, 3].every((order) => {
          const matches = moduleDetails.filter(
            (module) => Number(module.order) === order
          );

          return (
            matches.length === 1 &&
            matches[0].supported === true &&
            matches[0].completed === true
          );
        });

      const isCompleted = isSmartCityCourse
        ? smartCityCompleted
        : userCourse.is_completed === true;

      let progress;

      if (isSmartCityCourse) {
        const detailedProgress =
          moduleDetails.length > 0
            ? Math.floor(
                moduleDetails.reduce(
                  (total, module) =>
                    total + module.progress,
                  0
                ) / moduleDetails.length
              )
            : 0;

        progress = isCompleted
          ? 100
          : Math.min(99, detailedProgress);
      } else {
        progress = isCompleted
          ? 100
          : Math.min(99, videoPercentage);
      }

      // Conserva la restricción de contadores de intentos.
      const visibleModules = isAdmin
        ? moduleDetails
        : moduleDetails.map((detail) => {
            const {
              evaluationAttempts: moduleAttemptCount,
              ...publicDetail
            } = detail;

            const publicEvaluations =
              detail.evaluations.map((evaluation) => {
                const {
                  attempts,
                  ...publicEvaluation
                } = evaluation;

                return publicEvaluation;
              });

            const {
              attempts,
              ...publicIntegrative
            } = detail.integrative;

            return {
              ...publicDetail,
              evaluations: publicEvaluations,
              integrative: publicIntegrative,
            };
          });

      return {
        id: course.id,
        name: course.name,
        description: course.description,
        imageUrl: course.image_url,

        progress,
        modules: visibleModules,
        currentModuleId: userCourse.current_module_id,

        // Ya no depende únicamente del indicador
        // guardado en la inscripción para el curso 1.
        isCompleted,

        finalScore: userCourse.final_score,
        totalModules: modules.length,
        completedModules: approvedCourseModules,
        totalVideos: courseVideos.length,
        completedVideos,
        startedAt: userCourse.createdAt,
        lastActivity: userCourse.updatedAt,
      };
    });

    const coursesStarted = courses.length;

    // Usa la misma comprobación que las tarjetas.
    const coursesCompleted = courses.filter(
      (course) => course.isCompleted
    ).length;

    const videosStarted = currentVideoProgress.length;

    const videosCompleted = currentVideoProgress.filter(
      (progress) => progress.is_completed === true
    ).length;

    const totalWatchTime = currentVideoProgress.reduce(
      (total, progress) =>
        total +
        Math.max(0, Number(progress.time_watched) || 0),
      0
    );

    const evaluationsTaken = evaluationAttempts.length;

    const evaluationsPassed = evaluationAttempts.filter(
      (attempt) => attempt.passed === true
    ).length;

    const averageScore =
      evaluationsTaken > 0
        ? Math.round(
            evaluationAttempts.reduce(
              (total, attempt) =>
                total + (Number(attempt.score) || 0),
              0
            ) / evaluationsTaken
          )
        : 0;

    const bestScore = evaluationAttempts.reduce(
      (best, attempt) =>
        Math.max(best, Number(attempt.score) || 0),
      0
    );

    // Promedio de los cursos activos iniciados.
    const overallProgress =
      courses.length > 0
        ? Math.floor(
            courses.reduce(
              (total, course) => total + course.progress,
              0
            ) / courses.length
          )
        : 0;

    const videoActivity = currentVideoProgress.map(
      (progress) => ({
        type: progress.is_completed
          ? 'video_completed'
          : 'video_progress',

        title: progress.Video?.title || 'Contenido en video',

        course:
          progress.Video?.Module?.Course?.name || 'Curso',

        detail: progress.is_completed
          ? 'Video completado'
          : `${Math.round(
              progress.percentage || 0
            )}% visualizado`,

        date: progress.completed_at || progress.updatedAt,
      })
    );

    const evaluationActivity = evaluationAttempts.map(
      (attempt) => ({
        type: attempt.passed
          ? 'evaluation_passed'
          : 'evaluation_attempt',

        title: attempt.Evaluation?.title || 'Evaluación',

        course: attempt.Evaluation?.Course?.name || 'Curso',

        detail: attempt.passed
          ? `Aprobada con ${attempt.score} puntos`
          : `Calificación: ${attempt.score} puntos`,

        date: attempt.attempted_at,
      })
    );

    const recentActivity = [
      ...videoActivity,
      ...evaluationActivity,
    ]
      .filter((activity) => activity.date)
      .sort(
        (first, second) =>
          new Date(second.date) - new Date(first.date)
      )
      .slice(0, 8);

    return res.status(200).json({
      summary: {
        overallProgress,
        coursesStarted,
        coursesCompleted,
        totalModules,
        completedModules,
        videosStarted,
        videosCompleted,
        totalWatchTime,
        evaluationsTaken,
        evaluationsPassed,
        averageScore,
        bestScore,
      },
      courses,
      recentActivity,
    });
  } catch (error) {
    console.error('Error al consultar el avance:', error);

    return res.status(500).json({
      message:
        'No se pudo consultar el avance del participante',
    });
  }
};

module.exports = {
  getUsers,
  updateProfile,
  getMyProgress,
  updateUserStatus,
  getUserById,
};