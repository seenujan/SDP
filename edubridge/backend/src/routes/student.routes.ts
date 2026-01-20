import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { studentController } from '../controllers/StudentController';
import { announcementService } from '../services/AnnouncementService';
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

// Attendance
router.get('/attendance', (req, res) => studentController.getAttendance(req, res));

// Announcements
router.get('/announcements', async (req, res) => {
    try {
        const announcements = await announcementService.getAllAnnouncements();
        res.json(announcements);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
