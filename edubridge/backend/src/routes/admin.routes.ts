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

// Classes
router.get('/classes', (req, res) => userController.getClasses(req, res));

// User Management - Order matters! Specific routes before parameterized routes
router.get('/users/students', (req, res) => userController.getStudents(req, res));
router.get('/users/teachers', (req, res) => userController.getTeachers(req, res));
router.get('/users/parents', (req, res) => userController.getParents(req, res));
router.get('/users/parents-dropdown', (req, res) => userController.getParentsForDropdown(req, res));

router.get('/users', (req, res) => userController.getAllUsers(req, res));
router.get('/users/:id', (req, res) => userController.getUserById(req, res));
router.post('/users', (req, res) => userController.createUser(req, res));
router.put('/users/:id', (req, res) => userController.updateUser(req, res));
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

export default router;

