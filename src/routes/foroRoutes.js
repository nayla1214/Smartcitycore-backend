const express = require('express');

const {
  protect,
} = require('../middlewares/authMiddleware');

const {
  getMyPost,
  getPosts,
  publishPost,
  publishComment,
} = require('../controllers/foroController');

const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require(
  '../controllers/notificationController'
);

const router = express.Router();

/*
 * Notificaciones del usuario autenticado.
 * Se colocan antes de las rutas del tema.
 */

router.get(
  '/notifications',
  protect,
  getNotifications
);

router.post(
  '/notifications/read-all',
  protect,
  markAllNotificationsRead
);

router.post(
  '/notifications/:commentId/read',
  protect,
  markNotificationRead
);

/* Rutas originales del foro */

router.get(
  '/:topicNumber/mine',
  protect,
  getMyPost
);

router.get(
  '/:topicNumber/posts',
  protect,
  getPosts
);

router.post(
  '/:topicNumber/posts',
  protect,
  publishPost
);

router.post(
  '/:topicNumber/posts/:postId/comments',
  protect,
  publishComment
);

module.exports = router;