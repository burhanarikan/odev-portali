import { Router } from 'express';
import {
  getMyTimeline,
  getTimelineByClass,
  getTeacherClasses,
  createPost,
  deletePost,
} from '../controllers/timeline.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/my', authorize(['STUDENT']), getMyTimeline);
router.get('/class/:classId', authorize(['TEACHER', 'ADMIN']), getTimelineByClass);
router.get('/teacher/classes', authorize(['TEACHER', 'ADMIN']), getTeacherClasses);
router.post('/', authorize(['TEACHER', 'ADMIN']), createPost);
router.delete('/:id', authorize(['TEACHER', 'ADMIN']), deletePost);

export default router;
