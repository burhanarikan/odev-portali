import { Router } from 'express';
import {
  getMyErrors,
  getReviewList,
  addError,
  getErrorsByStudent,
} from '../controllers/errorBank.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/my', authorize(['STUDENT']), getMyErrors);
router.get('/my/review-list', authorize(['STUDENT']), getReviewList);
router.post('/', authorize(['TEACHER', 'ADMIN']), addError);
router.get('/student/:studentId', authorize(['TEACHER', 'ADMIN']), getErrorsByStudent);

export default router;
