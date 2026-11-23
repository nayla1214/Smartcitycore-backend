const express = require('express');

const router = express.Router();

const {
  getCourses,
  getAdminCourses,
  getCourseById,
  createCourse,
  updateCourse,
  getCourseProgress,
  deleteCourse,
} = require('../controllers/courseController');

const {
  protect,
} = require('../middlewares/authMiddleware');

const {
  courseAdmin,
} = require('../middlewares/roleMiddleware');

const {
  validateResourceId,
  validateCourseWrite,
} = require('../middlewares/courseValidationMiddleware');

router.get(
  '/',
  getCourses
);

router.get(
  '/admin',
  protect,
  courseAdmin,
  getAdminCourses
);

router.post(
  '/',
  protect,
  courseAdmin,
  validateCourseWrite,
  createCourse
);

router.get(
  '/:id/progress',
  protect,
  validateResourceId,
  getCourseProgress
);

router.get(
  '/:id',
  validateResourceId,
  getCourseById
);

router.put(
  '/:id',
  protect,
  courseAdmin,
  validateResourceId,
  validateCourseWrite,
  updateCourse
);
router.post(
  '/:id/delete',
  protect,
  courseAdmin,
  validateResourceId,
  deleteCourse
);
module.exports = router;