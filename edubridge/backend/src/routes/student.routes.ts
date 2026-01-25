import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { studentController } from '../controllers/StudentController';

import { resultsController } from '../controllers/ResultsController';
import { uploadSubmission } from '../middleware/upload';

const router = Router();

// All routes require authentication and student role
router.use(authenticate);
router.use(requireRole(['student']));

// Dashboard
router.get('/dashboard', (req, res) => studentController.getDashboard(req, res));

// Assignments
router.get('/assignments', (req, res) => studentController.getAssignments(req, res));

router.post('/assignments/:id/submit', uploadSubmission, (req, res) => studentController.submitAssignment(req, res));
router.get('/submissions', (req, res) => studentController.getMySubmissions(req, res));

// Exams
router.get('/exams', (req, res) => studentController.getExams(req, res));
router.get('/exams/:id', (req, res) => studentController.getExam(req, res));
router.post('/exams/:id/answer', (req, res) => studentController.saveAnswer(req, res));
router.post('/exams/:id/submit-attempt', (req, res) => studentController.submitExam(req, res));
router.get('/exams/:id/result', (req, res) => studentController.viewExamResult(req, res));

// Attendance
router.get('/attendance', (req, res) => studentController.getAttendance(req, res));

// Announcements


// Todos
router.get('/todos', (req, res) => studentController.getTodos(req, res));
router.post('/todos', (req, res) => studentController.createTodo(req, res));
router.put('/todos/:id', (req, res) => studentController.updateTodo(req, res));
router.delete('/todos/:id', (req, res) => studentController.deleteTodo(req, res));
router.patch('/todos/:id/toggle', (req, res) => studentController.toggleTodoStatus(req, res));

// Results
router.get('/results', (req, res) => resultsController.getMyResults(req, res));

// Portfolio
router.get('/portfolio', (req, res) => studentController.getPortfolio(req, res));

// Announcements & Events
router.get('/announcements', (req, res) => studentController.getAnnouncements(req, res));
router.get('/events', (req, res) => studentController.getEvents(req, res));

export default router;
