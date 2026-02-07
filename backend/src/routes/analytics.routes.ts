import { Router } from 'express';
import {
  getDashboardStats,
  getStudentProgress,
  getTeacherPerformance,
  getAllStudentsProgress,
  getCourseEndReport,
} from '../controllers/analytics.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/dashboard', getDashboardStats);
router.get('/student-progress/:studentId', authorize(['TEACHER', 'ADMIN']), getStudentProgress);
router.get('/teacher-performance', authorize(['TEACHER', 'ADMIN']), getTeacherPerformance);
router.get('/students-progress', authorize(['ADMIN']), getAllStudentsProgress);
router.get('/course-end-report', authorize(['ADMIN']), getCourseEndReport);

export default router;
