import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { userController } from '../controllers/UserController';
import { adminController } from '../controllers/AdminController';
import { timetableController } from '../controllers/TimetableController';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireRole(['admin']));

// Dashboard
router.get('/dashboard', (req, res) => adminController.getDashboard(req, res));

// Subjects
router.get('/subjects', (req, res) => adminController.getSubjects(req, res));

// Classes
router.get('/classes', (req, res) => userController.getClasses(req, res));

// User Management - Order matters! Specific routes before parameterized routes
router.get('/users/students', (req, res) => userController.getStudents(req, res));
router.get('/users/teachers', (req, res) => userController.getTeachers(req, res));
router.get('/users/parents', (req, res) => userController.getParents(req, res));
router.get('/users/parents-dropdown', (req, res) => userController.getParentsForDropdown(req, res));

router.get('/users', (req, res) => userController.getAllUsers(req, res));
router.get('/users/:id', (req, res) => userController.getUserById(req, res));
router.post('/users/student', (req, res) => adminController.createStudent(req, res));
router.post('/users/teacher', (req, res) => adminController.createTeacher(req, res));
router.post('/users/parent', (req, res) => adminController.createParent(req, res));
router.post('/users', (req, res) => userController.createUser(req, res)); // Keep generic for backward config or other uses
router.put('/users/:id', (req, res) => userController.updateUser(req, res));
router.patch('/users/:id/status', (req, res) => adminController.toggleUserStatus(req, res));
router.delete('/users/:id', (req, res) => userController.deleteUser(req, res));

// Timetable Management
router.get('/timetable/teachers-dropdown', (req, res) => timetableController.getTeachersForDropdown(req, res));
router.get('/timetable/class/:classId', (req, res) => timetableController.getTimetableByClass(req, res));
router.get('/timetable/teacher/:teacherId', (req, res) => timetableController.getTimetableByTeacher(req, res));
router.get('/timetable', (req, res) => timetableController.getAllTimetable(req, res));
router.get('/timetable/:id', (req, res) => timetableController.getTimetableById(req, res));
router.post('/timetable', (req, res) => timetableController.createTimetable(req, res));
router.put('/timetable/:id', (req, res) => timetableController.updateTimetable(req, res));
router.delete('/timetable/:id', (req, res) => timetableController.deleteTimetable(req, res));

// Announcements
router.get('/announcements', (req, res) => adminController.getAnnouncements(req, res));
router.post('/announcements', (req, res) => adminController.createAnnouncement(req, res));
router.put('/announcements/:id', (req, res) => adminController.updateAnnouncement(req, res));
router.delete('/announcements/:id', (req, res) => adminController.deleteAnnouncement(req, res));

// Events
router.get('/events', (req, res) => adminController.getEvents(req, res));
router.post('/events', (req, res) => adminController.createEvent(req, res));
router.put('/events/:id', (req, res) => adminController.updateEvent(req, res));
router.delete('/events/:id', (req, res) => adminController.deleteEvent(req, res));

// Student Portfolio Management
router.get('/portfolio/grades', (req, res) => adminController.getGrades(req, res));
router.get('/portfolio/grades/:grade/sections', (req, res) => adminController.getSectionsForGrade(req, res));
router.get('/portfolio/students', (req, res) => adminController.getStudentsByFilter(req, res));
router.get('/portfolio/student/:studentId', (req, res) => adminController.getStudentPortfolio(req, res));
router.put('/portfolio/entry/:entryId', (req, res) => adminController.updatePortfolioEntry(req, res));
router.delete('/portfolio/entry/:entryId', (req, res) => adminController.deletePortfolioEntry(req, res));

// Certificate Management
router.get('/certificate-types', (req, res) => adminController.getCertificateTypes(req, res));
router.get('/certificates', (req, res) => adminController.getAllCertificates(req, res));
router.post('/certificates', (req, res) => adminController.createCertificate(req, res));
router.delete('/certificates/:id', (req, res) => adminController.deleteCertificate(req, res));

// Progress Card Generation
router.get('/progress-card/:studentId', (req, res) => adminController.getProgressCardData(req, res));

// Reports
// Reports
router.get('/reports/attendance', (req, res) => adminController.getAttendanceReport(req, res));
router.get('/reports/exams', (req, res) => adminController.getExamReport(req, res));
router.get('/reports/certificates', (req, res) => adminController.getCertificateReport(req, res));
router.get('/reports/scholarships', (req, res) => adminController.getScholarshipReport(req, res));
router.get('/scholarships/eligible', (req, res) => adminController.getEligibleStudents(req, res));
router.get('/reports/users', (req, res) => adminController.getUserReport(req, res));
router.get('/reports/ptm-feedback', (req, res) => adminController.getPTMFeedbackReport(req, res));

export default router;

