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
} = require('../controllers/practicalEvaluationController');

const {
  getModuleEvaluation,
  submitModuleEvaluation,
} = require('../controllers/moduleEvaluationController');

const {
  protect,
} = require('../middlewares/authMiddleware');
const {
  getModule3Evaluation,
  submitModule3Evaluation,
} = require('../controllers/module3EvaluationController');
const {
  admin,
} = require('../middlewares/roleMiddleware');
const {
  getModule2Evaluation,
  submitModule2Evaluation,
} = require('../controllers/module2EvaluationController');
const titles = {
  '3.1':
    'Evaluación — Tema 3.1: Inteligencia artificial aplicada a servicios urbanos',

  '3.2':
    'Evaluación — Tema 3.2: Educación inteligente',

  '3.3':
    'Evaluación — Tema 3.3: Gemelos digitales y simulación urbana',
};
router.get(
  '/module/3/integrative',
  protect,
  getModule3Evaluation
);

router.post(
  '/module/3/integrative/submit',
  protect,
  submitModule3Evaluation
);
router.get(
  '/module/2/integrative',
  protect,
  getModule2Evaluation
);

router.post(
  '/module/2/integrative/submit',
  protect,
  submitModule2Evaluation
);
// Crear evaluaciones — Solo administrador
router
  .route('/')
  .post(protect, admin, createEvaluation);

// Evaluación integradora del módulo 1
// GET: cargar actividades y resultado previo.
// POST /submit: calificar y guardar el intento.
router
  .route('/module/1/integrative')
  .get(protect, getModuleEvaluation);

router
  .route('/module/1/integrative/submit')
  .post(protect, submitModuleEvaluation);

// Actividad práctica del tema 2.3
router
  .route('/practical/2.3')
  .get(protect, getPracticalEvaluation)
  .post(protect, submitPracticalEvaluation);

// Consultar el identificador de una evaluación por tema
router.get(
  '/topic/:topicNumber',
  protect,
  async (req, res) => {
    try {
      const title = titles[req.params.topicNumber];

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

// Mantener las rutas por ID después de las específicas
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