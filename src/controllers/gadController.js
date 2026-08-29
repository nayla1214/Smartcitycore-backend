const { Gad } = require('../models');

// @desc    Get all GADs
// @route   GET /api/gads
// @access  Public
const getGads = async (req, res) => {
    try {
        const gads = await Gad.findAll();
        res.status(200).json(gads);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get GAD by id or name
// @route   GET /api/gads/:identifier
// @access  Public
const getGad = async (req, res) => {
    try {
        const { identifier } = req.params;
        let gad;
        if (!isNaN(identifier)) {
            gad = await Gad.findByPk(identifier);
        } else {
            gad = await Gad.findOne({ where: { name: identifier } }); // e.g. /api/gads/Paján
        }

        if (!gad) {
            return res.status(404).json({ message: 'GAD not found' });
        }
        res.status(200).json(gad);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update a GAD
// @route   PUT /api/gads/:id
// @access  Private/Admin
const updateGad = async (req, res) => {
    try {
        const gad = await Gad.findByPk(req.params.id);
        if (!gad) {
            return res.status(404).json({ message: 'GAD not found' });
        }

        const { description, institutional_info, projects, activities, media_urls } = req.body;
        
        await gad.update({
            description: description !== undefined ? description : gad.description,
            institutional_info: institutional_info !== undefined ? institutional_info : gad.institutional_info,
            projects: projects !== undefined ? projects : gad.projects,
            activities: activities !== undefined ? activities : gad.activities,
            media_urls: media_urls !== undefined ? media_urls : gad.media_urls
        });

        res.status(200).json(gad);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getGads,
    getGad,
    updateGad
};
