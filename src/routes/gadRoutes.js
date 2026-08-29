const express = require('express');
const router = express.Router();
const { getGads, getGad, updateGad } = require('../controllers/gadController');
const { protect } = require('../middlewares/authMiddleware');
const { admin } = require('../middlewares/roleMiddleware');

router.route('/')
    .get(getGads); // Público

router.route('/:identifier')
    .get(getGad); // Público

router.route('/:id')
    .put(protect, admin, updateGad); // Solo Admin

module.exports = router;
