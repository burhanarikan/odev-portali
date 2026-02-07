import { Router } from 'express';
import {
  getDashboardStats,
  getStudentProgress,
  getTeacherPerformance,
  getAllStudentsProgress,
  getCourseEndReport,
  getTeacherWorkload,
  getStudentPortfolio,
  getClassLeaderboard,
} from '../controllers/analytics.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/dashboard', getDashboardStats);
router.get('/student-progress/:studentId', authorize(['TEACHER', 'ADMIN']), getStudentProgress);
router.get('/teacher-performance', authorize(['TEACHER', 'ADMIN']), getTeacherPerformance);
router.get('/students-progress', authorize(['ADMIN']), getAllStudentsProgress);
router.get('/course-end-report', authorize(['ADMIN']), getCourseEndReport);
router.get('/teacher-workload', authorize(['ADMIN']), getTeacherWorkload);
router.get('/portfolio/:studentId', authorize(['TEACHER', 'ADMIN']), getStudentPortfolio);
router.get('/class-leaderboard', getClassLeaderboard);

export default router;
