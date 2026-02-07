import { Router } from 'express';
import { listAnnouncements, createAnnouncement, deleteAnnouncement } from '../controllers/announcement.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, listAnnouncements);
router.post('/', authenticate, authorize(['TEACHER', 'ADMIN']), createAnnouncement);
router.delete('/:id', authenticate, authorize(['TEACHER', 'ADMIN']), deleteAnnouncement);

export default router;
