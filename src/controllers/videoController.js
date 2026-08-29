const { Video, VideoProgress, Module } = require('../models');

// @desc    Create a video
// @route   POST /api/videos
// @access  Private/Admin
const createVideo = async (req, res) => {
    try {
        const { moduleId, title, description, url, duration, order_number, status } = req.body;
        const video = await Video.create({
            moduleId,
            title,
            description,
            url,
            duration,
            order_number,
            status
        });
        res.status(201).json(video);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get videos by module
// @route   GET /api/videos/module/:moduleId
// @access  Public (in frontend we'll filter)
const getVideosByModule = async (req, res) => {
    try {
        const videos = await Video.findAll({
            where: { moduleId: req.params.moduleId },
            order: [['order_number', 'ASC']]
        });
        res.status(200).json(videos);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update video progress (Ping mechanism)
// @route   POST /api/videos/progress
// @access  Private
const updateProgress = async (req, res) => {
    try {
        const { videoId, current_time, duration: durationFromBody, isEnded } = req.body;
        const userId = req.user.id;

        // Preferir la duración real que envía el cliente desde YouTube
        let duration = durationFromBody && durationFromBody > 0 ? durationFromBody : 300;
        if (!durationFromBody || durationFromBody <= 0) {
            const video = await Video.findByPk(videoId);
            if (video && video.duration && video.duration > 0) {
                duration = video.duration;
            }
        }

        let progress = await VideoProgress.findOne({
            where: { userId, videoId }
        });

        if (!progress) {
            progress = await VideoProgress.create({
                userId,
                videoId,
                time_watched: 0,
                percentage: 0,
                is_completed: false
            });
        }

        // Si ya está completado en la BD, devolver siempre 100% y completado
        if (progress.is_completed) {
            return res.status(200).json({
                ...progress.toJSON(),
                percentage: 100,
                is_completed: true
            });
        }

        let new_time = Math.max(current_time || 0, progress.time_watched || 0);

        let percentage = (new_time / duration) * 100;
        if (isNaN(percentage) || !isFinite(percentage)) percentage = 0;

        let is_completed = false;
        let completed_at = null;

        // Considerar completado si llega al 80% o si terminó el video
        if (percentage >= 80 || isEnded) {
            is_completed = true;
            completed_at = new Date();
            percentage = 100;
            new_time = duration;
        }

        await progress.update({
            time_watched: new_time,
            percentage: percentage > 100 ? 100 : percentage,
            is_completed,
            completed_at
        });

        res.status(200).json(progress);
    } catch (error) {
        console.error('Error in updateProgress:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get user progress for a video
// @route   GET /api/videos/:videoId/progress
// @access  Private
const getProgress = async (req, res) => {
    try {
        const progress = await VideoProgress.findOne({
            where: { userId: req.user.id, videoId: req.params.videoId }
        });
        res.status(200).json(progress || { time_watched: 0, percentage: 0, is_completed: false });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    createVideo,
    getVideosByModule,
    updateProgress,
    getProgress
};
