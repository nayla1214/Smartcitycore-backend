const { Op } = require('sequelize');

const {
  Foro,
  ForoComment,
  User,
} = require('../models');

const ForumNotificationRead = require(
  '../models/ForumNotificationRead'
);

// Consulta únicamente comentarios de otras personas
// en las publicaciones del usuario autenticado.
const ownedComments = (userId, id) => {
  return ForoComment.findAll({
    where: {
      userId: {
        [Op.ne]: userId,
      },

      ...(id === undefined
        ? {}
        : { id }),
    },

    attributes: [
      'id',
      'postId',
      'userId',
      'content',
      'createdAt',
    ],

    include: [
      {
        model: Foro,

        required: true,

        where: {
          userId,
        },

        attributes: [
          'id',
          'topicNumber',
          'content',
        ],
      },
      {
        model: User,

        required: true,

        attributes: [
          'id',
          'name',
        ],
      },
    ],

    order: [
      ['createdAt', 'DESC'],
      ['id', 'DESC'],
    ],
  });
};

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const [
      comments,
      reads,
    ] = await Promise.all([
      ownedComments(userId),

      ForumNotificationRead.findAll({
        where: {
          userId,
        },

        attributes: [
          'commentId',
        ],

        raw: true,
      }),
    ]);

    const readIds = new Set(
      reads.map(
        (row) => Number(row.commentId)
      )
    );

    const unreadCount = comments.filter(
      (comment) =>
        !readIds.has(
          Number(comment.id)
        )
    ).length;

    const requestedOffset = Number(
      req.query.offset ?? 0
    );

    const offset =
      Number.isSafeInteger(requestedOffset) &&
      requestedOffset >= 0
        ? requestedOffset
        : 0;

    const limit = 20;

    const notifications = comments
      .slice(
        offset,
        offset + limit
      )
      .map((comment) => ({
        id: comment.id,

        postId: comment.postId,

        topicNumber:
          comment.Foro.topicNumber,

        actorName:
          comment.User.name,

        content:
          comment.content,

        postContent:
          comment.Foro.content,

        createdAt:
          comment.createdAt,

        read: readIds.has(
          Number(comment.id)
        ),
      }));

    return res.json({
      notifications,

      unreadCount,

      total: comments.length,

      offset,

      hasMore:
        offset + limit < comments.length,
    });
  } catch (error) {
    console.error(
      'Error consultando notificaciones:',
      error
    );

    return res.status(500).json({
      message:
        'No se pudieron consultar las notificaciones.',
    });
  }
};

const markNotificationRead = async (req, res) => {
  const id = Number(
    req.params.commentId
  );

  if (
    !Number.isSafeInteger(id) ||
    id < 1
  ) {
    return res.status(400).json({
      message: 'Notificación inválida.',
    });
  }

  try {
    const comments = await ownedComments(
      req.user.id,
      id
    );

    if (!comments.length) {
      return res.status(404).json({
        message:
          'Notificación no encontrada.',
      });
    }

    await ForumNotificationRead.bulkCreate(
      [
        {
          userId: req.user.id,
          commentId: id,
        },
      ],
      {
        ignoreDuplicates: true,
        validate: true,
      }
    );

    return res.json({
      id,
      read: true,
    });
  } catch (error) {
    console.error(
      'Error marcando notificación:',
      error
    );

    return res.status(500).json({
      message:
        'No se pudo marcar la notificación como leída.',
    });
  }
};

const markAllNotificationsRead = async (
  req,
  res
) => {
  try {
    const comments = await ownedComments(
      req.user.id
    );

    const rows = comments.map(
      (comment) => ({
        userId: req.user.id,
        commentId: comment.id,
      })
    );

    if (rows.length > 0) {
      await ForumNotificationRead.bulkCreate(
        rows,
        {
          ignoreDuplicates: true,
          validate: true,
        }
      );
    }

    return res.json({
      read: true,
    });
  } catch (error) {
    console.error(
      'Error marcando notificaciones:',
      error
    );

    return res.status(500).json({
      message:
        'No se pudieron marcar las notificaciones.',
    });
  }
};

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};