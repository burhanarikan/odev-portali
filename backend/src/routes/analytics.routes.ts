import { Router } from 'express';
import {
  getDashboardStats,
  getStudentProgress,
  getTeacherPerformance,
} from '../controllers/analytics.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/dashboard', getDashboardStats);
router.get('/student-progress/:studentId', authorize(['TEACHER', 'ADMIN']), getStudentProgress);
router.get('/teacher-performance', authorize(['TEACHER', 'ADMIN']), getTeacherPerformance);

export default router;
