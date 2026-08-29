const { Course, Module, Evaluation, EvaluationAttempt, UserCourse } = require('../models');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
const getCourses = async (req, res) => {
    try {
        const courses = await Course.findAll({
            where: { status: true },
            include: [{ model: Module, attributes: ['id', 'title', 'order_number'] }]
        });
        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all courses (Admin)
// @route   GET /api/courses/admin
// @access  Private/Admin
const getAdminCourses = async (req, res) => {
    try {
        const courses = await Course.findAll({
            include: [{ model: Module }]
        });
        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get course by ID
// @route   GET /api/courses/:id
// @access  Public
const getCourseById = async (req, res) => {
    try {
        const course = await Course.findByPk(req.params.id, {
            include: [{ model: Module, order: [['order_number', 'ASC']] }]
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.status(200).json(course);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a course
// @route   POST /api/courses
// @access  Private/Admin
const createCourse = async (req, res) => {
    try {
        const { name, description, image_url, status } = req.body;
        const course = await Course.create({
            name,
            description,
            image_url,
            status
        });
        res.status(201).json(course);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update a course
// @route   PUT /api/courses/:id
// @access  Private/Admin
const updateCourse = async (req, res) => {
    try {
        const course = await Course.findByPk(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const { name, description, image_url, status } = req.body;
        await course.update({
            name: name !== undefined ? name : course.name,
            description: description !== undefined ? description : course.description,
            image_url: image_url !== undefined ? image_url : course.image_url,
            status: status !== undefined ? status : course.status
        });

        res.status(200).json(course);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get user progress for a course
// @route   GET /api/courses/:id/progress
// @access  Private
const getCourseProgress = async (req, res) => {
    try {
        const courseId = req.params.id;
        const userId = req.user.id;

        const modules = await Module.findAll({
            where: { courseId },
            order: [['order_number', 'ASC']]
        });

        // Para cada módulo, verificar si el usuario aprobó su evaluación
        const progressData = [];
        for (const mod of modules) {
            const evaluation = await Evaluation.findOne({ where: { moduleId: mod.id, is_final: false } });
            let passed = false;
            if (evaluation) {
                const attempt = await EvaluationAttempt.findOne({
                    where: { userId, evaluationId: evaluation.id, passed: true }
                });
                passed = !!attempt;
            }
            progressData.push({ moduleId: mod.id, order_number: mod.order_number, passed });
        }

        // Buscar UserCourse para saber si el curso está completado
        const userCourse = await UserCourse.findOne({ where: { userId, courseId } });
        const isCompleted = userCourse?.is_completed || false;
        const finalScore = userCourse?.final_score || null;

        res.status(200).json({ modules: progressData, isCompleted, finalScore });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getCourses,
    getAdminCourses,
    getCourseById,
    createCourse,
    updateCourse,
    getCourseProgress
};
