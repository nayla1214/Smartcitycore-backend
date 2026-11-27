const express = require('express');
const router = express.Router();

const {
  getMyCertificates,
  getCertificateByCode,
  issueCertificate,
} = require('../controllers/certificateController');

const {
  protect,
} = require('../middlewares/authMiddleware');

router.get('/', protect, getMyCertificates);

router.post(
  '/course/:courseId/issue',
  protect,
  issueCertificate
);

router.get('/:code', getCertificateByCode);

module.exports = router;