const express = require('express');

const {
  protect,
} = require('../middlewares/authMiddleware');

const {
  teacher,
} = require('../middlewares/roleMiddleware');

const {
  getTeachingParticipants,
  getTeachingParticipantProgress,
  getTeachingForumTopics,
  getTeachingForumPosts,
  publishTeachingComment,
} = require('../controllers/teacherSupportController');

const router = express.Router();

router.use(protect, teacher);

router.get(
  '/courses/:courseId/participants',
  getTeachingParticipants
);

router.get(
  '/courses/:courseId/participants/:userId/progress',
  getTeachingParticipantProgress
);

router.get(
  '/courses/:courseId/forum-topics',
  getTeachingForumTopics
);

router.get(
  '/courses/:courseId/forums/:topicNumber/posts',
  getTeachingForumPosts
);

router.post(
  '/courses/:courseId/forums/:topicNumber/posts/:postId/comments',
  publishTeachingComment
);

module.exports = router;