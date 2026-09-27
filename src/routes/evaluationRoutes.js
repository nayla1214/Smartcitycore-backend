const express = require('express');
const router = express.Router();

const {
  createEvaluation,
  getEvaluation,
  submitEvaluation,
  getEvaluationProgress,
} = require('../controllers/evaluationController');

const { protect } = require('../middlewares/authMiddleware');
const { admin } = require('../middlewares/roleMiddleware');

router.route('/')
  .post(protect, admin, createEvaluation);

router.route('/:id/progress')
  .get(protect, getEvaluationProgress);

router.route('/:id/submit')
  .post(protect, submitEvaluation);

router.route('/:id')
  .get(protect, getEvaluation);

module.exports = router;
