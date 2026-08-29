const { Certificate, Course, User } = require('../models');

// @desc    Get user certificates
// @route   GET /api/certificates
// @access  Private
const getMyCertificates = async (req, res) => {
    try {
        const certificates = await Certificate.findAll({
            where: { userId: req.user.id },
            include: [{ model: Course }]
        });
        res.status(200).json(certificates);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get certificate by unique code
// @route   GET /api/certificates/:code
// @access  Public
const getCertificateByCode = async (req, res) => {
    try {
        const certificate = await Certificate.findOne({
            where: { unique_code: req.params.code },
            include: [
                { model: Course },
                { model: User, attributes: ['id', 'name'] }
            ]
        });

        if (!certificate) {
            return res.status(404).json({ message: 'Certificate not found' });
        }
        res.status(200).json(certificate);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getMyCertificates,
    getCertificateByCode
};
