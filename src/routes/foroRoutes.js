const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const {
  getMyPost,
  getPosts,
  publishPost
} = require('../controllers/foroController');

const router = express.Router();

router.get('/1.1/mine', protect, getMyPost);
router.get('/1.1/posts', protect, getPosts);
router.post('/1.1/posts', protect, publishPost);

module.exports = router;