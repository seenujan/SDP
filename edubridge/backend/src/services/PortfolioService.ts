import { pool } from '../config/database';
import { RowDataPacket } from 'mysql2';

export class PortfolioService {
    // Get all portfolio entries for a student
    async getStudentPortfolio(studentId: number) {
        // Query portfolios and join with teachers (users) to get teacher's name
        // Note: The schema says teacher_id in portfolios references users(id) directly
        // It might be a teacher in the 'teachers' table or 'users' table.
        // The foreign key says `FOREIGN KEY (teacher_id) REFERENCES users(id)`

        const [rows] = await pool.query(
            `SELECT p.*, 
                    u.role as creator_role,
                    -- Try to get name from teachers table if possible, else users?
                    -- Actually teacher_id FK references users(id). 
                    -- But let's see where the name is stored.
                    -- The 'teachers' table has user_id and full_name.
                    -- If teacher_id is the user_id, we can join teachers on user_id = p.teacher_id
                    COALESCE(t.full_name, 'Teacher') as teacher_name
             FROM portfolios p
             LEFT JOIN teachers t ON p.teacher_id = t.user_id
             WHERE p.student_id = ?
             ORDER BY p.created_at DESC`,
            [studentId]
        );
        return rows;
    }
}

export const portfolioService = new PortfolioService();
