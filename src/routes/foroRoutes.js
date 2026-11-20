const express = require('express');
const { protect } = require('../middlewares/authMiddleware');

const {
  getMyPost,
  getPosts,
  publishPost,
  publishComment,
} = require('../controllers/foroController');

const router = express.Router();

router.get('/:topicNumber/mine', protect, getMyPost);
router.get('/:topicNumber/posts', protect, getPosts);
router.post('/:topicNumber/posts', protect, publishPost);

router.post(
  '/:topicNumber/posts/:postId/comments',
  protect,
  publishComment
);

module.exports = router;