const express = require('express');

const {
  protect,
} = require('../middlewares/authMiddleware');

const {
  getTeachingEvaluation,
  getTeachingEvaluationResults,
} = require('../controllers/teacherEvaluationController');

const router = express.Router();

router.use(protect);

router.get(
  '/:evaluationId',
  getTeachingEvaluation
);

router.get(
  '/:evaluationId/results',
  getTeachingEvaluationResults
);

module.exports = router;