const { Evaluation, Question, Option, EvaluationAttempt, Video, VideoProgress, Module, UserCourse, Certificate } = require('../models');

// @desc    Create Evaluation (Admin)
// @route   POST /api/evaluations
// @access  Private/Admin
const createEvaluation = async (req, res) => {
    try {
        const { moduleId, courseId, title, is_final, questions } = req.body;
        
        const evaluation = await Evaluation.create({
            moduleId,
            courseId,
            title,
            is_final
        });

        if (questions && questions.length > 0) {
            for (const q of questions) {
                const question = await Question.create({
                    evaluationId: evaluation.id,
                    text: q.text,
                    score: q.score || 1
                });
                if (q.options && q.options.length > 0) {
                    for (const opt of q.options) {
                        await Option.create({
                            questionId: question.id,
                            text: opt.text,
                            is_correct: opt.is_correct
                        });
                    }
                }
            }
        }

        res.status(201).json(evaluation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Evaluation with Questions
// @route   GET /api/evaluations/:id
// @access  Private
const getEvaluation = async (req, res) => {
    try {
        const evaluation = await Evaluation.findByPk(req.params.id, {
            include: [{
                model: Question,
                include: [{ model: Option, attributes: ['id', 'text'] }]
            }]
        });

        if (!evaluation) {
            // Frontend will use hardcoded evaluation if 404
            return res.status(404).json({ message: 'Evaluation not found in DB' });
        }

        res.status(200).json(evaluation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Submit Evaluation
// @route   POST /api/evaluations/:id/submit
// @access  Private
const submitEvaluation = async (req, res) => {
    try {
        const { answers, percentage: scoreFromFrontend, is_final, courseId } = req.body;
        const evaluationId = parseInt(req.params.id);
        const evaluation = await Evaluation.findByPk(evaluationId, {
            include: [{ model: Question, include: [Option] }]
        });

        let percentage = typeof scoreFromFrontend === 'number' ? scoreFromFrontend : 0;
        let passed = false;

        if (typeof scoreFromFrontend !== 'number' && evaluation && evaluation.Questions && evaluation.Questions.length > 0) {
            let totalScore = 0;
            let maxScore = 0;

            evaluation.Questions.forEach(q => {
                maxScore += q.score || 1;
                const answer = answers?.find(a => a.questionId === q.id);
                if (answer) {
                    const selectedOption = q.Options.find(o => o.id === answer.optionId);
                    if (selectedOption && selectedOption.is_correct) {
                        totalScore += q.score || 1;
                    }
                }
            });

            percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
        }

        passed = percentage >= 70;

        let attempt = null;
        try {
            attempt = await EvaluationAttempt.create({
                userId: req.user.id,
                evaluationId,
                score: percentage,
                passed
            });
        } catch (dbErr) {
            console.warn('EvaluationAttempt DB insert skipped:', dbErr.message);
            attempt = { userId: req.user.id, evaluationId, score: percentage, passed };
        }

        if (passed) {
            const targetCourseId = courseId || evaluation?.courseId || 1;
            if (is_final || evaluation?.is_final) {
                // Generar certificado si no existe ya uno
                const existingCert = await Certificate.findOne({
                    where: { userId: req.user.id, courseId: targetCourseId }
                });
                if (!existingCert) {
                    await Certificate.create({
                        userId: req.user.id,
                        courseId: targetCourseId
                    });
                }
                
                let uc = await UserCourse.findOne({ where: { userId: req.user.id, courseId: targetCourseId } });
                if (uc) {
                    await uc.update({ is_completed: true, final_score: percentage });
                } else {
                    await UserCourse.create({ userId: req.user.id, courseId: targetCourseId, is_completed: true, final_score: percentage });
                }
            } else {
                let uc = await UserCourse.findOne({ where: { userId: req.user.id, courseId: targetCourseId } });
                if (!uc) {
                    await UserCourse.create({ userId: req.user.id, courseId: targetCourseId });
                }
            }
        }

        res.status(200).json({ attempt, percentage, passed });
    } catch (error) {
        console.error('Error submitting evaluation:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    createEvaluation,
    getEvaluation,
    submitEvaluation
};
