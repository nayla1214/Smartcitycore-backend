const express = require('express');
const router = express.Router();
const { createEvaluation, getEvaluation, submitEvaluation } = require('../controllers/evaluationController');
const { protect } = require('../middlewares/authMiddleware');
const { admin } = require('../middlewares/roleMiddleware');

router.route('/')
    .post(protect, admin, createEvaluation);

router.route('/:id')
    .get(protect, getEvaluation);

router.route('/:id/submit')
    .post(protect, submitEvaluation);

module.exports = router;
