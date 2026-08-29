const express = require('express');
const router = express.Router();
const { createVideo, getVideosByModule, updateProgress, getProgress } = require('../controllers/videoController');
const { protect } = require('../middlewares/authMiddleware');
const { admin } = require('../middlewares/roleMiddleware');

router.route('/')
    .post(protect, admin, createVideo);

router.route('/module/:moduleId')
    .get(getVideosByModule);

router.route('/progress')
    .post(protect, updateProgress);

router.route('/:videoId/progress')
    .get(protect, getProgress);

module.exports = router;
