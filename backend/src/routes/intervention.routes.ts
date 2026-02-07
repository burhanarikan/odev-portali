import { Router } from 'express';
import { getAtRiskStudents, addLog, getLogs } from '../controllers/intervention.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize(['TEACHER', 'ADMIN']));

router.get('/at-risk', getAtRiskStudents);
router.post('/log', addLog);
router.get('/logs', getLogs);

export default router;
