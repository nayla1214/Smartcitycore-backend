const { Foro, User, VideoProgress } = require('../models');

const getMyPost = async (req, res) => {
  try {
    const post = await Foro.findOne({
      where: { userId: req.user.id, topicNumber: '1.1' }
    });

    res.json(post);
  } catch (error) {
    console.error('Error consultando foro:', error);
    res.status(500).json({ message: 'No se pudo consultar el foro.' });
  }
};

const getPosts = async (req, res) => {
  try {
    const posts = await Foro.findAll({
      where: { topicNumber: '1.1' },
      include: [{ model: User, attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']]
    });

    res.json(posts);
  } catch (error) {
    console.error('Error consultando publicaciones:', error);
    res.status(500).json({ message: 'No se pudieron consultar las respuestas.' });
  }
};

const publishPost = async (req, res) => {
  try {
    const content = req.body.content?.trim();

    if (!content || content.length < 30 || content.length > 3000) {
      return res.status(400).json({
        message: 'Escribe una respuesta de entre 30 y 3000 caracteres.'
      });
    }

    const videoProgress = await VideoProgress.findOne({
      where: { userId: req.user.id, videoId: 1, is_completed: true }
    });

    if (!videoProgress) {
      return res.status(403).json({
        message: 'Termina el video antes de participar en el foro.'
      });
    }

    const existing = await Foro.findOne({
      where: { userId: req.user.id, topicNumber: '1.1' }
    });

    if (existing) {
      return res.status(409).json({
        message: 'Ya publicaste tu respuesta en este tema.'
      });
    }

    const post = await Foro.create({
      userId: req.user.id,
      topicNumber: '1.1',
      content
    });

    res.status(201).json(post);
  } catch (error) {
    console.error('Error publicando respuesta:', error);
    res.status(500).json({ message: 'No se pudo publicar la respuesta.' });
  }
};

module.exports = { getMyPost, getPosts, publishPost };