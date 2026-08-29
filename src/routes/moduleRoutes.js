const express = require('express');
const router = express.Router();
const { getModulesByCourse, getModuleById, createModule, updateModule } = require('../controllers/moduleController');
const { protect } = require('../middlewares/authMiddleware');
const { admin } = require('../middlewares/roleMiddleware');

router.route('/')
    .post(protect, admin, createModule);

router.route('/course/:courseId')
    .get(getModulesByCourse);

router.route('/:id')
    .get(getModuleById)
    .put(protect, admin, updateModule);

module.exports = router;
