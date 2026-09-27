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
  protect,
} = require('../middlewares/authMiddleware');

const {
  admin,
} = require('../middlewares/roleMiddleware');

/* Rutas de la cuenta del usuario autenticado */

router.put('/me', protect, updateProfile);

router.get(
  '/me/progress',
  protect,
  getMyProgress,
);

/* Rutas exclusivas para administradores */

router.use(protect, admin);

router.get('/', getUsers);

router.get('/:id', getUserById);

router.put('/:id/status', updateUserStatus);

module.exports = router;