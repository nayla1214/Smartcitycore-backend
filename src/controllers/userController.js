const { Op } = require('sequelize');

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

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: {
        exclude: ['password'],
      },
    });

    res.status(200).json(users);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Error al consultar los usuarios',
    });
  }
};

// @desc    Update authenticated user profile
// @route   PUT /api/users/me
// @access  Private
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

// @desc    Update user status
// @route   PUT /api/users/:id/status
// @access  Private/Admin
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

    res.status(200).json({
      message: 'Estado del usuario actualizado',
      user: {
        id: user.id,
        status: user.status,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Error al actualizar el usuario',
    });
  }
};

// @desc    Get specific user with courses
// @route   GET /api/users/:id
// @access  Private/Admin
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

    res.status(200).json(user);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Error al consultar el usuario',
    });
  }
};
// @desc    Get authenticated participant progress
// @route   GET /api/users/me/progress
// @access  Private
const getMyProgress = async (req, res) => {
  try {
    const userId = req.user.id;

    const [userCourses, videoProgress, evaluationAttempts] =
      await Promise.all([
        UserCourse.findAll({
          where: {
            userId,
          },
          include: [
            {
              model: Course,
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
          where: {
            userId,
          },
          include: [
            {
              model: Video,
              attributes: [
                'id',
                'title',
                'moduleId',
              ],
              include: [
                {
                  model: Module,
                  attributes: [
                    'id',
                    'title',
                    'courseId',
                  ],
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
          where: {
            userId,
          },
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

    const progressByVideo = new Map();

    videoProgress.forEach((progress) => {
      progressByVideo.set(progress.videoId, progress);
    });

    let totalModules = 0;
    let completedModules = 0;

    const courses = userCourses.map((userCourse) => {
      const course = userCourse.Course;
      const modules = course?.Modules || [];

      totalModules += modules.length;

      const courseVideos = modules.flatMap(
        (module) => module.Videos || [],
      );

      const completedVideos = courseVideos.filter((video) => {
        const progress = progressByVideo.get(video.id);

        return progress?.is_completed;
      }).length;

      const accumulatedVideoProgress = courseVideos.reduce(
        (total, video) => {
          const progress = progressByVideo.get(video.id);

          return total + Number(progress?.percentage || 0);
        },
        0,
      );

      const videoPercentage =
        courseVideos.length > 0
          ? Math.round(
              accumulatedVideoProgress /
                courseVideos.length,
            )
          : 0;

      const completedCourseModules = modules.filter(
        (module) => {
          const moduleVideos = module.Videos || [];

          if (moduleVideos.length === 0) {
            return false;
          }

          return moduleVideos.every((video) => {
            const progress = progressByVideo.get(video.id);

            return progress?.is_completed;
          });
        },
      ).length;

      completedModules += completedCourseModules;

      const courseProgress = userCourse.is_completed
        ? 100
        : Math.min(videoPercentage, 100);

      return {
        id: course.id,
        name: course.name,
        description: course.description,
        imageUrl: course.image_url,
        progress: courseProgress,
        currentModuleId: userCourse.current_module_id,
        isCompleted: userCourse.is_completed,
        finalScore: userCourse.final_score,
        totalModules: modules.length,
        completedModules: completedCourseModules,
        totalVideos: courseVideos.length,
        completedVideos,
        startedAt: userCourse.createdAt,
        lastActivity: userCourse.updatedAt,
      };
    });

    const coursesStarted = userCourses.length;

    const coursesCompleted = userCourses.filter(
      (course) => course.is_completed,
    ).length;

    const videosStarted = videoProgress.length;

    const videosCompleted = videoProgress.filter(
      (progress) => progress.is_completed,
    ).length;

    const totalWatchTime = videoProgress.reduce(
      (total, progress) =>
        total + Number(progress.time_watched || 0),
      0,
    );

    const evaluationsTaken = evaluationAttempts.length;

    const evaluationsPassed = evaluationAttempts.filter(
      (attempt) => attempt.passed,
    ).length;

    const averageScore =
      evaluationsTaken > 0
        ? Math.round(
            evaluationAttempts.reduce(
              (total, attempt) =>
                total + Number(attempt.score || 0),
              0,
            ) / evaluationsTaken,
          )
        : 0;

    const bestScore =
      evaluationsTaken > 0
        ? Math.max(
            ...evaluationAttempts.map((attempt) =>
              Number(attempt.score || 0),
            ),
          )
        : 0;

    const overallProgress =
      courses.length > 0
        ? Math.round(
            courses.reduce(
              (total, course) =>
                total + course.progress,
              0,
            ) / courses.length,
          )
        : 0;

    const videoActivity = videoProgress.map((progress) => ({
      type: progress.is_completed
        ? 'video_completed'
        : 'video_progress',
      title: progress.Video?.title || 'Contenido en video',
      course:
        progress.Video?.Module?.Course?.name ||
        'Curso',
      detail: progress.is_completed
        ? 'Video completado'
        : `${Math.round(progress.percentage || 0)}% visualizado`,
      date:
        progress.completed_at ||
        progress.updatedAt,
    }));

    const evaluationActivity = evaluationAttempts.map(
      (attempt) => ({
        type: attempt.passed
          ? 'evaluation_passed'
          : 'evaluation_attempt',
        title:
          attempt.Evaluation?.title ||
          'Evaluación',
        course:
          attempt.Evaluation?.Course?.name ||
          'Curso',
        detail: attempt.passed
          ? `Aprobada con ${attempt.score} puntos`
          : `Calificación: ${attempt.score} puntos`,
        date: attempt.attempted_at,
      }),
    );

    const recentActivity = [
      ...videoActivity,
      ...evaluationActivity,
    ]
      .filter((activity) => activity.date)
      .sort(
        (first, second) =>
          new Date(second.date) -
          new Date(first.date),
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
    console.error(
      'Error al consultar el avance:',
      error,
    );

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