const { Module, Video, Evaluation } = require('../models');

// @desc    Get modules by course ID
// @route   GET /api/modules/course/:courseId
// @access  Public (in frontend we'll filter based on enrollment later)
const getModulesByCourse = async (req, res) => {
    try {
        const modules = await Module.findAll({
            where: { courseId: req.params.courseId },
            include: [
                { model: Video, attributes: ['id', 'title', 'duration', 'order_number'] },
                { model: Evaluation, attributes: ['id', 'title'] }
            ],
            order: [['order_number', 'ASC']]
        });
        res.status(200).json(modules);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get module by ID
// @route   GET /api/modules/:id
// @access  Public
const getModuleById = async (req, res) => {
    try {
        const moduleItem = await Module.findByPk(req.params.id, {
            include: [
                { model: Video, order: [['order_number', 'ASC']] },
                { model: Evaluation }
            ]
        });

        if (!moduleItem) {
            return res.status(404).json({ message: 'Module not found' });
        }
        res.status(200).json(moduleItem);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a module
// @route   POST /api/modules
// @access  Private/Admin
const createModule = async (req, res) => {
    try {
        const { courseId, title, description, order_number, status } = req.body;
        const newModule = await Module.create({
            courseId,
            title,
            description,
            order_number,
            status
        });
        res.status(201).json(newModule);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update a module
// @route   PUT /api/modules/:id
// @access  Private/Admin
const updateModule = async (req, res) => {
    try {
        const moduleItem = await Module.findByPk(req.params.id);
        if (!moduleItem) {
            return res.status(404).json({ message: 'Module not found' });
        }

        const { title, description, order_number, status } = req.body;
        await moduleItem.update({
            title: title !== undefined ? title : moduleItem.title,
            description: description !== undefined ? description : moduleItem.description,
            order_number: order_number !== undefined ? order_number : moduleItem.order_number,
            status: status !== undefined ? status : moduleItem.status
        });

        res.status(200).json(moduleItem);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getModulesByCourse,
    getModuleById,
    createModule,
    updateModule
};
