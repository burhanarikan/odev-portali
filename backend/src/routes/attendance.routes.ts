import { Router } from 'express';
import {
  startSession,
  joinSession,
  getSessionLive,
  getSessionByCode,
  getSessionsForTeacher,
  getAbsenceReport,
} from '../controllers/attendance.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/start', authenticate, authorize(['TEACHER', 'ADMIN']), startSession);
router.post('/join', authenticate, authorize(['STUDENT']), joinSession);
router.get('/sessions', authenticate, authorize(['TEACHER', 'ADMIN']), getSessionsForTeacher);
router.get('/session/:id/live', authenticate, authorize(['TEACHER', 'ADMIN']), getSessionLive);
router.get('/by-code/:code', authenticate, authorize(['TEACHER', 'ADMIN']), getSessionByCode);
router.get('/absence-report', authenticate, authorize(['TEACHER', 'ADMIN']), getAbsenceReport);

export default router;
