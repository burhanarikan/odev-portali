import { Router } from 'express';
import {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  checkSimilarity,
  getAssignmentsByWeek,
  getAssignmentsByLevel,
  getLevels,
  getStudents,
  getStudentById,
  getSubmissions,
  submitEvaluation,
  createGroup,
  addStudentToGroup,
  removeStudentFromGroup,
  getGroups,
  getHomeworks,
  createHomework,
  getHomeworkById,
  updateHomework,
  deleteHomework,
} from '../controllers/teacher.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize(['TEACHER', 'ADMIN']));

router.get('/levels', getLevels);
router.get('/homeworks', getHomeworks);
router.post('/homeworks', createHomework);
router.get('/homeworks/:id', getHomeworkById);
router.put('/homeworks/:id', updateHomework);
router.delete('/homeworks/:id', deleteHomework);
router.get('/students', getStudents);
router.get('/students/:id', getStudentById);
router.get('/submissions', getSubmissions);
router.post('/submissions/:submissionId/evaluation', submitEvaluation);
router.post('/assignments', createAssignment);
router.get('/assignments', getAssignments);
router.get('/assignments/:id', getAssignmentById);
router.put('/assignments/:id', updateAssignment);
router.delete('/assignments/:id', deleteAssignment);
router.post('/assignments/check-similarity', checkSimilarity);
router.get('/assignments/by-week/:weekNumber', getAssignmentsByWeek);
router.get('/assignments/by-level/:levelId', getAssignmentsByLevel);

// Grup ödevleri
router.post('/groups', createGroup);
router.post('/groups/:groupId/students', addStudentToGroup);
router.delete('/groups/:groupId/students/:studentId', removeStudentFromGroup);
router.get('/assignments/:id/groups', getGroups);

export default router;
