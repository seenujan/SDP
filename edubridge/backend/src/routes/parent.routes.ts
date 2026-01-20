import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { parentController } from '../controllers/ParentController';
import { announcementService } from '../services/AnnouncementService';

const router = Router();

// All routes require authentication and parent role
router.use(authenticate);
router.use(requireRole(['parent']));

// Dashboard
router.get('/dashboard', (req, res) => parentController.getDashboard(req, res));

// Child data
router.get('/child/:childId/attendance', (req, res) =>
    parentController.getChildAttendance(req, res)
);
router.get('/child/:childId/progress', (req, res) =>
    parentController.getChildProgress(req, res)
);

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
