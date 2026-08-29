const express = require('express');
const router = express.Router();
const { getCourses, getAdminCourses, getCourseById, createCourse, updateCourse, getCourseProgress } = require('../controllers/courseController');
const { protect } = require('../middlewares/authMiddleware');
const { admin } = require('../middlewares/roleMiddleware');

router.route('/')
    .get(getCourses)
    .post(protect, admin, createCourse);

router.route('/admin')
    .get(protect, admin, getAdminCourses);

router.route('/:id')
    .get(getCourseById)
    .put(protect, admin, updateCourse);

router.route('/:id/progress')
    .get(protect, getCourseProgress);

module.exports = router;
