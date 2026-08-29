const express = require('express');
const router = express.Router();
const { getMyCertificates, getCertificateByCode } = require('../controllers/certificateController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
    .get(protect, getMyCertificates);

router.route('/:code')
    .get(getCertificateByCode); // Verificación pública de certificado

module.exports = router;
