import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { parentController } from '../controllers/ParentController';
import { announcementService, eventService } from '../services/AnnouncementService';

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
router.get('/child/:childId/portfolio', (req, res) =>
    parentController.getChildPortfolio(req, res)
);
router.get('/child/:childId/results', (req, res) =>
    parentController.getChildResults(req, res)
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

// Events
router.get('/events', async (req, res) => {
    try {
        const events = await eventService.getAllEvents();
        res.json(events);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// PTM Booking
router.get('/ptm/my-requests', (req, res) => parentController.getMyPTMs(req, res));
router.post('/ptm/request', (req, res) => parentController.requestPTM(req, res));
router.put('/ptm/:id/respond', (req, res) => parentController.respondToAlternative(req, res));
router.put('/ptm/:id/status', (req, res) => parentController.updatePTMStatus(req, res));
// Booked Slots
router.get('/teachers/:teacherId/booked-slots', (req, res) => parentController.getBookedSlots(req, res));
router.get('/child/:childId/teachers', (req, res) => parentController.getChildTeachers(req, res));

export default router;
