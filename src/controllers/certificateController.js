const { Op } = require('sequelize');

const { Certificate } = require('../models');

const {
  issueCourseCertificate,
} = require('../services/certificateService');

const serializeCertificate = (certificate) => {
  const snapshot = certificate.issued_snapshot;

  return {
    id: certificate.id,
    courseId: certificate.courseId,
    unique_code: certificate.unique_code,
    issue_date: certificate.issue_date,
    participantName: snapshot.participantName,
    courseName: snapshot.courseName,
    finalScore: snapshot.finalScore,
    scoreScale: snapshot.scoreScale,
  };
};

// GET /api/certificates
const getMyCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.findAll({
      where: {
        userId: req.user.id,
        issued_snapshot: {
          [Op.ne]: null,
        },
      },
      order: [['issue_date', 'DESC']],
    });

    return res.status(200).json(
      certificates
        .filter(
          (item) =>
            item.issued_snapshot?.version === 1
        )
        .map(serializeCertificate)
    );
  } catch (error) {
    console.error('Error consultando certificados:', error);

    return res.status(500).json({
      message: 'No se pudieron consultar los certificados.',
    });
  }
};

// POST /api/certificates/course/:courseId/issue
const issueCertificate = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);

    if (!Number.isSafeInteger(courseId) || courseId < 1) {
      return res.status(400).json({
        message: 'Identificador del curso inválido.',
      });
    }

    const certificate = await issueCourseCertificate(
      req.user.id,
      courseId
    );

    return res.status(200).json(
      serializeCertificate(certificate)
    );
  } catch (error) {
    if (!error.status) {
      console.error('Error emitiendo certificado:', error);
    }

    return res.status(error.status || 500).json({
      message:
        error.status
          ? error.message
          : 'No se pudo emitir el certificado.',
    });
  }
};

// GET /api/certificates/:code
// Verificación pública.
const getCertificateByCode = async (req, res) => {
  try {
    const code = String(req.params.code || '');

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        code
      )
    ) {
      return res.status(400).json({
        message: 'Código de certificado inválido.',
      });
    }

    const certificate = await Certificate.findOne({
      where: { unique_code: code },
    });

    if (
      !certificate ||
      certificate.issued_snapshot?.version !== 1
    ) {
      return res.status(404).json({
        message: 'Certificado emitido no encontrado.',
      });
    }

    return res.status(200).json(
      serializeCertificate(certificate)
    );
  } catch (error) {
    console.error('Error verificando certificado:', error);

    return res.status(500).json({
      message: 'No se pudo verificar el certificado.',
    });
  }
};

module.exports = {
  getMyCertificates,
  getCertificateByCode,
  issueCertificate,
};