import { Router } from 'express';
import {
  listPages,
  getPage,
  createPage,
  updatePage,
  deletePage,
} from '../controllers/teacherWiki.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize(['TEACHER', 'ADMIN']));

router.get('/', listPages);
router.get('/:id', getPage);
router.post('/', createPage);
router.put('/:id', updatePage);
router.delete('/:id', deletePage);

export default router;
