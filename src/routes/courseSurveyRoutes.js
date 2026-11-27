const express = require('express');

const {
  protect,
} = require('../middlewares/authMiddleware');

const {
  courseAdmin,
} = require('../middlewares/roleMiddleware');

const {
  getMySurvey,
  submitMySurvey,
} = require('../controllers/courseSurveyController');

const {
  getSurveyResults,
} = require('../controllers/adminSurveyController');

const {
  getGeneralSurveyReport,
  getIndividualSurveyReport,
} = require('../controllers/surveyReportController');

const router = express.Router();

router.use(protect);

router.get(
  '/:courseId/report',
  courseAdmin,
  getGeneralSurveyReport
);

router.get(
  '/:courseId/responses/:surveyId/report',
  courseAdmin,
  getIndividualSurveyReport
);

router.get(
  '/:courseId/results',
  courseAdmin,
  getSurveyResults
);

router.get(
  '/:courseId/me',
  getMySurvey
);

router.post(
  '/:courseId/me',
  submitMySurvey
);

module.exports = router;