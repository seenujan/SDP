import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { timetableService } from '../services/TimetableService';

export class TimetableController {
    // GET /api/admin/timetable - Get all timetable entries
    async getAllTimetable(req: AuthRequest, res: Response) {
        try {
            const timetable = await timetableService.getAllTimetable();
            res.json(timetable);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // GET /api/admin/timetable/class/:classId - Get timetable for a specific class
    async getTimetableByClass(req: AuthRequest, res: Response) {
        try {
            const timetable = await timetableService.getTimetableByClass(parseInt(req.params.classId));
            res.json(timetable);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // GET /api/admin/timetable/teacher/:teacherId - Get timetable for a specific teacher
    async getTimetableByTeacher(req: AuthRequest, res: Response) {
        try {
            const timetable = await timetableService.getTimetableByTeacher(parseInt(req.params.teacherId));
            res.json(timetable);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // GET /api/admin/timetable/:id - Get timetable entry by ID
    async getTimetableById(req: AuthRequest, res: Response) {
        try {
            const entry = await timetableService.getTimetableById(parseInt(req.params.id));
            if (!entry) {
                return res.status(404).json({ error: 'Timetable entry not found' });
            }
            res.json(entry);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // POST /api/admin/timetable - Create timetable entry
    async createTimetable(req: AuthRequest, res: Response) {
        try {
            const entry = await timetableService.createTimetable(req.body);
            res.status(201).json(entry);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    // PUT /api/admin/timetable/:id - Update timetable entry
    async updateTimetable(req: AuthRequest, res: Response) {
        try {
            const entry = await timetableService.updateTimetable(parseInt(req.params.id), req.body);
            res.json(entry);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    // DELETE /api/admin/timetable/:id - Delete timetable entry
    async deleteTimetable(req: AuthRequest, res: Response) {
        try {
            const result = await timetableService.deleteTimetable(parseInt(req.params.id));
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    // GET /api/admin/timetable/teachers-dropdown - Get teachers for dropdown
    async getTeachersForDropdown(req: AuthRequest, res: Response) {
        try {
            const teachers = await timetableService.getTeachersForDropdown();
            res.json(teachers);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const timetableController = new TimetableController();
