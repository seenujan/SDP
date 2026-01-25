import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { resultsService } from '../services/ResultsService';
import { pool } from '../config/database';
import { RowDataPacket } from 'mysql2';

export class ResultsController {
    async getMyResults(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;

            // Get student_id from user_id
            const [students] = await pool.query<RowDataPacket[]>(
                'SELECT id FROM students WHERE user_id = ?',
                [userId]
            );

            if (students.length === 0) {
                return res.status(404).json({ error: 'Student profile not found' });
            }

            const studentId = students[0].id;

            const results = await resultsService.getStudentResults(studentId);
            res.json(results);
        } catch (error: any) {
            console.error('Error fetching results:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

export const resultsController = new ResultsController();
