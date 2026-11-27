const express = require('express');

const router = express.Router();

const {
  createVideo,
  getVideosByModule,
  updateVideoContent,
  updateProgress,
  getProgress,
} = require('../controllers/videoController');

const {
  protect,
} = require('../middlewares/authMiddleware');

const {
  admin,
} = require('../middlewares/roleMiddleware');

// Creación de videos: administración.
router.post(
  '/',
  protect,
  admin,
  createVideo
);

// Consulta de videos.
router.get(
  '/module/:moduleId',
  getVideosByModule
);

// Seguimiento del participante.
router.post(
  '/progress',
  protect,
  updateProgress
);

router.get(
  '/:videoId/progress',
  protect,
  getProgress
);

// Editar título y descripción.
// El controlador comprueba el rol y la asignación.
router.put(
  '/:videoId/content',
  protect,
  updateVideoContent
);

module.exports = router;