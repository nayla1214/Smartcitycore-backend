const express = require('express');

const router = express.Router();

const {
  Module,
  Evaluation,
} = require('../models');

const {
  createEvaluation,
  getEvaluation,
  submitEvaluation,
  getEvaluationProgress,
} = require('../controllers/evaluationController');

const {
  getPracticalEvaluation,
  submitPracticalEvaluation,
} = require(
  '../controllers/practicalEvaluationController'
);

const {
  protect,
} = require('../middlewares/authMiddleware');

const {
  admin,
} = require('../middlewares/roleMiddleware');

const titles = {
  '3.1':
    'Evaluación — Tema 3.1: Inteligencia artificial aplicada a servicios urbanos',

  '3.2':
    'Evaluación — Tema 3.2: Educación inteligente',

  '3.3':
    'Evaluación — Tema 3.3: Gemelos digitales y simulación urbana',
};

router
  .route('/')
  .post(protect, admin, createEvaluation);

router
  .route('/practical/2.3')
  .get(protect, getPracticalEvaluation)
  .post(protect, submitPracticalEvaluation);

router.get(
  '/topic/:topicNumber',
  protect,
  async (req, res) => {
    try {
      const title =
        titles[req.params.topicNumber];

      if (!title) {
        return res.status(404).json({
          message: 'Tema no encontrado.',
        });
      }

      const mod = await Module.findOne({
        where: {
          courseId: 1,
          order_number: 3,
        },
      });

      const evaluation = mod
        ? await Evaluation.findOne({
            where: {
              moduleId: mod.id,
              courseId: 1,
              is_final: false,
              title,
            },

            attributes: [
              'id',
              'title',
              'moduleId',
              'courseId',
            ],
          })
        : null;

      if (!evaluation) {
        return res.status(404).json({
          message:
            `Registra primero la evaluación del tema ${req.params.topicNumber}.`,
        });
      }

      return res.json(evaluation);
    } catch (error) {
      console.error(
        'Error consultando evaluación:',
        error
      );

      return res.status(500).json({
        message:
          'No se pudo consultar la evaluación.',
      });
    }
  }
);

router
  .route('/:id/progress')
  .get(protect, getEvaluationProgress);

router
  .route('/:id/submit')
  .post(protect, submitEvaluation);

router
  .route('/:id')
  .get(protect, getEvaluation);

module.exports = router;