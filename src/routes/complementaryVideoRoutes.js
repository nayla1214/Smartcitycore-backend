const express = require('express');

const {
  protect,
} = require('../middlewares/authMiddleware');

const {
  getComplementaryVideos,
  createComplementaryVideo,
  updateComplementaryVideoTopic,
} = require('../controllers/complementaryVideoController');

const router = express.Router();

router.use(protect);

router.get(
  '/module/:moduleId',
  getComplementaryVideos
);

router.post(
  '/module/:moduleId',
  createComplementaryVideo
);

router.put(
  '/:videoId/topic',
  updateComplementaryVideoTopic
);

module.exports = router;