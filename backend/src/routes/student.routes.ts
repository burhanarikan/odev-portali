import { Router } from 'express';
import {
  getAssignments,
  getAssignmentById,
  submitAssignment,
  getSubmission,
  getEvaluations,
  getMyPortfolio,
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

export default router;
