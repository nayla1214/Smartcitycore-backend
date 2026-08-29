const express = require('express');
const router = express.Router();
const { getUsers, updateUserStatus, getUserById } = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const { admin } = require('../middlewares/roleMiddleware');

// Todas las rutas de usuarios requieren ser Admin
router.use(protect, admin);

router.route('/')
    .get(getUsers);

router.route('/:id')
    .get(getUserById);

router.route('/:id/status')
    .put(updateUserStatus);

module.exports = router;
