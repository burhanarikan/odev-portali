import { Router } from 'express';
import {
  getSubmissionsToReview,
  submitPeerReview,
  getPeerReviewsReceived,
  getMyReceivedPeerReviews,
  getMyPeerReviews,
  getFairnessLeaderboard,
} from '../controllers/peerReview.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get(
  '/assignments/:assignmentId/submissions-to-review',
  authorize(['STUDENT']),
  getSubmissionsToReview
);
router.post('/reviews', authorize(['STUDENT']), submitPeerReview);
router.get(
  '/submissions/:submissionId/reviews',
  authorize(['STUDENT', 'TEACHER', 'ADMIN']),
  getPeerReviewsReceived
);
router.get('/my-reviews', authorize(['STUDENT']), getMyPeerReviews);
router.get('/my-received-reviews', authorize(['STUDENT']), getMyReceivedPeerReviews);
router.get('/fairness-leaderboard', getFairnessLeaderboard);

export default router;
