import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { dashboardService } from '../services/DashboardService';
import { attendanceService } from '../services/AttendanceService';
import { assignmentService } from '../services/AssignmentService';
import { pool } from '../config/database';

export class ParentController {
    // GET /api/parent/dashboard
    async getDashboard(req: AuthRequest, res: Response) {
        try {
            const data = await dashboardService.getParentDashboard(req.user!.id);
            res.json(data);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // GET /api/parent/child/:childId/attendance
    async getChildAttendance(req: AuthRequest, res: Response) {
        try {
            const childId = parseInt(req.params.childId);

            // Verify this child belongs to this parent
            const [child]: any = await pool.query(
                'SELECT * FROM students WHERE id = ? AND parent_id = ?',
                [childId, req.user!.id]
            );

            if (!child[0]) {
                return res.status(403).json({ error: 'Access denied' });
            }

            const attendance = await attendanceService.getStudentAttendance(childId);
            const stats = await attendanceService.getAttendanceStats(childId);

            res.json({ attendance, stats });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // GET /api/parent/child/:childId/progress
    async getChildProgress(req: AuthRequest, res: Response) {
        try {
            const childId = parseInt(req.params.childId);

            // Verify this child belongs to this parent
            const [child]: any = await pool.query(
                'SELECT * FROM students WHERE id = ? AND parent_id = ?',
                [childId, req.user!.id]
            );

            if (!child[0]) {
                return res.status(403).json({ error: 'Access denied' });
            }

            const submissions = await assignmentService.getStudentSubmissions(childId);

            res.json({ submissions });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const parentController = new ParentController();
