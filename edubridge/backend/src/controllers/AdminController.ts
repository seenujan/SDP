import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { dashboardService } from '../services/DashboardService';
import { userService } from '../services/UserService';
import { announcementService, eventService } from '../services/AnnouncementService';

export class AdminController {
    // GET /api/admin/dashboard
    async getDashboard(req: AuthRequest, res: Response) {
        try {
            const data = await dashboardService.getAdminDashboard();
            res.json(data);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Announcements
    async createAnnouncement(req: AuthRequest, res: Response) {
        try {
            const announcement = await announcementService.createAnnouncement({
                ...req.body,
                postedBy: req.user!.id,
            });
            res.status(201).json(announcement);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async getAnnouncements(req: AuthRequest, res: Response) {
        try {
            const announcements = await announcementService.getAllAnnouncements();
            res.json(announcements);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async updateAnnouncement(req: AuthRequest, res: Response) {
        try {
            const announcement = await announcementService.updateAnnouncement(
                parseInt(req.params.id),
                req.body
            );
            res.json(announcement);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async deleteAnnouncement(req: AuthRequest, res: Response) {
        try {
            await announcementService.deleteAnnouncement(parseInt(req.params.id));
            res.json({ success: true });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Events
    async createEvent(req: AuthRequest, res: Response) {
        try {
            const event = await eventService.createEvent({
                ...req.body,
                createdBy: req.user!.id,
            });
            res.status(201).json(event);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async getEvents(req: AuthRequest, res: Response) {
        try {
            const events = await eventService.getAllEvents();
            res.json(events);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async updateEvent(req: AuthRequest, res: Response) {
        try {
            const event = await eventService.updateEvent(
                parseInt(req.params.id),
                req.body
            );
            res.json(event);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async deleteEvent(req: AuthRequest, res: Response) {
        try {
            await eventService.deleteEvent(parseInt(req.params.id));
            res.json({ success: true });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const adminController = new AdminController();
