
import { Request, Response } from 'express';
import { LeaveService } from '../services/LeaveService';

export class LeaveController {
    static async getLeaveTypes(req: Request, res: Response) {
        try {
            const types = await LeaveService.getLeaveTypes();
            res.json(types);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch leave types' });
        }
    }

    static async applyLeave(req: Request, res: Response) {
        try {
            const teacherId = (req as any).user.id; // From Auth Middleware
            const leaveId = await LeaveService.applyLeave(teacherId, req.body);
            res.status(201).json({ message: 'Leave application submitted successfully', leaveId });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async getMyBalance(req: Request, res: Response) {
        try {
            const teacherId = (req as any).user.id;
            const year = new Date().getFullYear();
            const balance = await LeaveService.getLeaveBalance(teacherId, year);
            res.json(balance);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch leave balance' });
        }
    }

    static async getMyHistory(req: Request, res: Response) {
        try {
            const teacherId = (req as any).user.id;
            const history = await LeaveService.getTeacherHistory(teacherId);
            res.json(history);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch leave history' });
        }
    }

    static async getPendingLeaves(req: Request, res: Response) {
        try {
            const leaves = await LeaveService.getPendingLeaves();
            res.json(leaves);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch pending leaves' });
        }
    }

    static async getAllLeaves(req: Request, res: Response) {
        try {
            const leaves = await LeaveService.getAllLeaves();
            res.json(leaves);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch leave history' });
        }
    }

    static async updateStatus(req: Request, res: Response) {
        try {
            const { leaveId, status, rejectionReason } = req.body;
            const approverId = (req as any).user.id;

            await LeaveService.updateLeaveStatus(leaveId, status, rejectionReason, approverId);
            res.json({ message: `Leave ${status} successfully` });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update leave status' });
        }
    }

    static async getReliefTeachers(req: Request, res: Response) {
        try {
            const teacherId = (req as any).user.id;
            const { startDate, endDate } = req.query;

            // Validate dates if provided
            if (startDate && !endDate) return res.status(400).json({ error: 'End date required' });

            const teachers = await LeaveService.getAvailableReliefTeachers(
                teacherId,
                startDate as string,
                endDate as string
            );
            res.json(teachers);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch relief teachers' });
        }
    }

    static async getReliefRequests(req: Request, res: Response) {
        try {
            const teacherId = (req as any).user.id;
            const requests = await LeaveService.getReliefRequests(teacherId);
            res.json(requests);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch relief requests' });
        }
    }

    static async respondToReliefRequest(req: Request, res: Response) {
        try {
            const teacherId = (req as any).user.id;
            const { leaveId, status, reason } = req.body;
            await LeaveService.respondToReliefRequest(leaveId, teacherId, status, reason);
            res.json({ message: 'Response submitted successfully' });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async cancelLeave(req: Request, res: Response) {
        try {
            const teacherId = (req as any).user.id;
            const leaveId = parseInt(req.params.id);
            await LeaveService.cancelLeave(leaveId, teacherId);
            res.json({ message: 'Leave application cancelled successfully' });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}
