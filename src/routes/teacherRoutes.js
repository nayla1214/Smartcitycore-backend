const express = require('express');

const {
  protect,
} = require('../middlewares/authMiddleware');

const {
  courseAdmin,
  teacher,
} = require('../middlewares/roleMiddleware');

const {
  getAvailableTeachers,
  getCourseTeachers,
  assignTeacher,
  removeTeacher,
  getMyTeachingCourses,
} = require('../controllers/teacherController');

const {
  getTeachingContent,
  updateTeachingModuleContent,
} = require('../controllers/teacherContentController');

const router = express.Router();

router.use(protect);

// Cursos asignados al docente.
router.get(
  '/me/courses',
  teacher,
  getMyTeachingCourses
);

// La información general del curso
// es exclusiva de la administración.
router.put(
  '/me/courses/:courseId',
  teacher,
  (req, res) => {
    return res.status(403).json({
      message:
        'La información general y el nombre del curso solo pueden ser modificados por el administrador tutor.',
    });
  }
);

// Consulta de contenidos del curso asignado.
router.get(
  '/me/courses/:courseId/content',
  teacher,
  getTeachingContent
);

// Edición del contenido descriptivo del módulo.
router.put(
  '/me/courses/:courseId/modules/:moduleId/content',
  teacher,
  updateTeachingModuleContent
);

// Administración de asignaciones.
router.get(
  '/available',
  courseAdmin,
  getAvailableTeachers
);

router.get(
  '/courses/:courseId/teachers',
  courseAdmin,
  getCourseTeachers
);

router.post(
  '/courses/:courseId/teachers',
  courseAdmin,
  assignTeacher
);

router.delete(
  '/courses/:courseId/teachers/:userId',
  courseAdmin,
  removeTeacher
);

router.post(
  '/courses/:courseId/teachers/:userId/remove',
  courseAdmin,
  removeTeacher
);

module.exports = router;