import { Router } from 'express';
import { listResources, createResource, deleteResource } from '../controllers/teacherResource.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize(['TEACHER', 'ADMIN']));

router.get('/', listResources);
router.post('/', createResource);
router.delete('/:id', deleteResource);

export default router;
