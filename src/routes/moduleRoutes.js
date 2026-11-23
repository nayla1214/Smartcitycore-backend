const express = require('express');

const router = express.Router();

const {
  getModulesByCourse,
  getModuleById,
  createModule,
  updateModule,
} = require('../controllers/moduleController');

const {
  getTopicsByModule,
  createTopic,
  updateTopic,
} = require('../controllers/topicController');

const {
  protect,
} = require('../middlewares/authMiddleware');

const {
  courseAdmin,
} = require('../middlewares/roleMiddleware');

const {
  validateResourceId,
  validateModuleWrite,
} = require('../middlewares/courseValidationMiddleware');

router.post(
  '/',
  protect,
  courseAdmin,
  validateModuleWrite,
  createModule
);

router.get(
  '/course/:courseId',
  getModulesByCourse
);

router.get(
  '/:id/topics',
  protect,
  validateResourceId,
  getTopicsByModule
);

router.post(
  '/:id/topics',
  protect,
  courseAdmin,
  validateResourceId,
  createTopic
);

router.put(
  '/:id/topics/:topicId',
  protect,
  courseAdmin,
  validateResourceId,
  updateTopic
);

router.get(
  '/:id',
  validateResourceId,
  getModuleById
);

router.put(
  '/:id',
  protect,
  courseAdmin,
  validateResourceId,
  validateModuleWrite,
  updateModule
);

module.exports = router;