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
        const videoId = Number(req.body.videoId);
        const currentTime = Number(req.body.current_time);
        const duration = Number(req.body.duration);
        const isEnded = req.body.isEnded === true;
        const userId = req.user.id;

        if (
            !Number.isInteger(videoId) ||
            !Number.isFinite(currentTime) ||
            !Number.isFinite(duration) ||
            currentTime < 0 ||
            duration <= 0 ||
            currentTime > duration + 2
        ) {
            return res.status(400).json({ message: 'Datos del video no válidos.' });
        }

        const video = await Video.findByPk(videoId);
        if (!video) {
            return res.status(404).json({ message: 'Video no encontrado.' });
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

        if (progress.is_completed) {
            return res.status(200).json(progress);
        }

        const previousPosition = Number(progress.time_watched) || 0;
        const elapsedSeconds = Math.max(
            0,
            (Date.now() - new Date(progress.updatedAt).getTime()) / 1000
        );

        // Se admite un pequeño margen por retrasos de red y por el intervalo
        // de 3 segundos entre envíos del reproductor.
        const allowedAdvance = elapsedSeconds + 2;
        const advance = currentTime - previousPosition;

        if (advance > allowedAdvance) {
            return res.status(200).json(progress);
        }

        // Volver atrás en el video no borra lo ya visto.
        const verifiedPosition = Math.max(previousPosition, currentTime);
        const reachedEnd = currentTime >= duration - 2;

        const isCompleted =
            isEnded &&
            reachedEnd &&
            verifiedPosition >= duration - 2;

        await progress.update({
            time_watched: isCompleted
                ? Math.ceil(duration)
                : Math.floor(verifiedPosition),
            percentage: isCompleted
                ? 100
                : Math.min(99, (verifiedPosition / duration) * 100),
            is_completed: isCompleted,
            completed_at: isCompleted ? new Date() : null
        });

        return res.status(200).json(progress);
    } catch (error) {
        console.error('Error in updateProgress:', error);
        return res.status(500).json({ message: 'Server Error' });
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
