const express = require('express');

const router = express.Router();

const {
  getUsers,
  updateProfile,
  getMyProgress,
  getUserById,
} = require('../controllers/userController');

const {
  updateUserRole,
  updateManagedUserStatus,
  getManagedUserProgress,
} = require('../controllers/adminUserController');

const {
  getStartedCourses,
  startCourse,
} = require('../controllers/courseEnrollmentController');

const {
  getMyReadings,
  saveMyReadings,
} = require('../controllers/readingProgressController');

const {
  protect,
} = require('../middlewares/authMiddleware');

const {
  admin,
  superAdmin,
} = require('../middlewares/roleMiddleware');

/* Cuenta del usuario autenticado */

router.put(
  '/me',
  protect,
  updateProfile
);

router.get(
  '/me/progress',
  protect,
  getMyProgress
);

router.get(
  '/me/courses/started',
  protect,
  getStartedCourses
);

router.post(
  '/me/courses/:courseId/start',
  protect,
  startCourse
);

router.get(
  '/me/readings/:topicNumber',
  protect,
  getMyReadings
);

router.post(
  '/me/readings/:topicNumber',
  protect,
  saveMyReadings
);

/* Administración */

router.use(protect, admin);

router.get(
  '/',
  getUsers
);

router.get(
  '/:id/progress',
  getManagedUserProgress
);

router.put(
  '/:id/role',
  superAdmin,
  updateUserRole
);

router.put(
  '/:id/status',
  updateManagedUserStatus
);

router.get(
  '/:id',
  getUserById
);

module.exports = router;