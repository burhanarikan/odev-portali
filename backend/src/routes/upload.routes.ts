import { Router } from 'express';
import { uploadToBlob, deleteFromBlob } from '../controllers/upload.controller';
import { uploadSingleMemory } from '../middleware/uploadMemory';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/blob', uploadSingleMemory('file'), uploadToBlob);
router.post('/blob/delete', deleteFromBlob);

export default router;
