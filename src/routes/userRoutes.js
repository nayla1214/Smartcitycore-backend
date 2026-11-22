const express = require('express');

const router = express.Router();

const {
  getUsers,
  updateProfile,
  getMyProgress,
  updateUserStatus,
  getUserById,
} = require('../controllers/userController');

const {
  getMyReadings,
  saveMyReadings,
} = require(
  '../controllers/readingProgressController'
);

const {
  protect,
} = require('../middlewares/authMiddleware');

const {
  admin,
} = require('../middlewares/roleMiddleware');

/* Rutas de la cuenta del usuario autenticado */

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
  '/me/readings/:topicNumber',
  protect,
  getMyReadings
);

router.post(
  '/me/readings/:topicNumber',
  protect,
  saveMyReadings
);

/* Rutas exclusivas para administradores */

router.use(protect, admin);

router.get(
  '/',
  getUsers
);

router.get(
  '/:id',
  getUserById
);

router.put(
  '/:id/status',
  updateUserStatus
);

module.exports = router;