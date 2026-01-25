import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { teacherController } from '../controllers/TeacherController';
import { uploadAssignment } from '../middleware/upload';

const router = Router();

// All routes require authentication and teacher role
router.use(authenticate);
router.use(requireRole(['teacher']));

// Dashboard
router.get('/dashboard', (req, res) => teacherController.getDashboard(req, res));

// Attendance
router.post('/attendance', (req, res) => teacherController.markAttendance(req, res));

// Assignments
router.get('/assignments', (req, res) => teacherController.getMyAssignments(req, res));
router.post('/assignments', uploadAssignment, (req, res) => teacherController.createAssignment(req, res));
router.get('/assignments/:assignmentId/submissions', (req, res) =>
    teacherController.getAssignmentSubmissions(req, res)
);
router.post('/submissions/:submissionId/mark', (req, res) =>
    teacherController.markAssignment(req, res)
);
router.post('/assignments/marks/upload', (req, res) =>
    teacherController.bulkUploadAssignmentMarks(req, res)
);

// Classes
router.get('/classes', (req, res) => teacherController.getMyClasses(req, res));
router.get('/classes/:classId/students', (req, res) => teacherController.getClassStudents(req, res));

// Timetable
router.get('/timetable', (req, res) => teacherController.getMyTimetable(req, res));

// Attendance History
router.get('/attendance/history', (req, res) => teacherController.getAttendanceHistory(req, res));

// Exams
router.get('/exams', (req, res) => teacherController.getExams(req, res));
router.get('/exams/:id', (req, res) => teacherController.getExamById(req, res));
router.post('/exams', (req, res) => teacherController.createExam(req, res));
router.put('/exams/:id', (req, res) => teacherController.updateExam(req, res));
router.delete('/exams/:id', (req, res) => teacherController.deleteExam(req, res));
router.post('/exams/:id/questions', (req, res) => teacherController.addQuestionsToExam(req, res));
router.delete('/exams/:id/questions/:questionId', (req, res) => teacherController.removeQuestionFromExam(req, res));
router.put('/exams/:id/publish', (req, res) => teacherController.publishExam(req, res));
router.get('/exams/:id/submissions', (req, res) => teacherController.getExamSubmissions(req, res));
router.get('/exams/attempt/:attemptId', (req, res) => teacherController.getStudentAttemptDetails(req, res));

// Marks
router.post('/marks/upload', (req, res) => teacherController.uploadMarks(req, res));
router.get('/marks/:examId', (req, res) => teacherController.getMarksByExam(req, res));

// Term Marks
router.post('/term-marks/upload', (req, res) => teacherController.uploadTermMarks(req, res));
router.get('/term-marks/:classId/:term/:subject', (req, res) => teacherController.getTermMarks(req, res));

// Question Bank
router.get('/question-bank', (req, res) => teacherController.getQuestions(req, res));
router.post('/question-bank', (req, res) => teacherController.createQuestion(req, res));
router.put('/question-bank/:id', (req, res) => teacherController.updateQuestion(req, res));
router.delete('/question-bank/:id', (req, res) => teacherController.deleteQuestion(req, res));

// Student Portfolio
router.get('/student-portfolio/:studentId', (req, res) => teacherController.getStudentPortfolio(req, res));
router.post('/student-portfolio', (req, res) => teacherController.addPortfolioEntry(req, res));

// PTM Booking
router.get('/ptm-requests', (req, res) => teacherController.getPTMRequests(req, res));
router.put('/ptm-requests/:id', (req, res) => teacherController.updatePTMStatus(req, res));

export default router;
