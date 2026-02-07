import { Router } from 'express';
import {
  getAssignments,
  getAssignmentById,
  submitAssignment,
  getSubmission,
  getEvaluations,
  getMyPortfolio,
  getConsent,
  recordConsent,
  getMissedSessions,
  getAvailableMakeUpSlots,
  getMyMakeUpBookings,
  bookMakeUpSlot,
} from '../controllers/student.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize(['STUDENT']));

router.get('/assignments', getAssignments);
router.get('/assignments/:id', getAssignmentById);
router.post('/submissions', submitAssignment);
router.get('/submissions/:assignmentId', getSubmission);
router.get('/evaluations', getEvaluations);
router.get('/portfolio', getMyPortfolio);
router.get('/consent', getConsent);
router.post('/consent', recordConsent);
router.get('/missed-sessions', getMissedSessions);
router.get('/makeup-slots', getAvailableMakeUpSlots);
router.get('/makeup-bookings', getMyMakeUpBookings);
router.post('/makeup-slots/:slotId/book', bookMakeUpSlot);

export default router;
