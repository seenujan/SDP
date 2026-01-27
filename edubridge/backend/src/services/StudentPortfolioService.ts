import { pool } from '../config/database';
import { RowDataPacket } from 'mysql2';

export class StudentPortfolioService {
    // Get all portfolio entries for a student (for admin view)
    async getAllPortfolioEntries(studentId: number): Promise<any> {
        const [entries] = await pool.query<RowDataPacket[]>(
            `SELECT 
                p.*,
                t.full_name as teacher_name,
                s.full_name as student_name,
                s.roll_number
            FROM portfolios p
            JOIN teachers t ON p.teacher_id = t.id
            JOIN students s ON p.student_id = s.id
            WHERE p.student_id = ?
            ORDER BY p.created_at DESC`,
            [studentId]
        );
        return entries;
    }

    // Get student info with all portfolio entries
    async getStudentPortfolio(studentId: number): Promise<any> {
        // Get student basic info
        const [students] = await pool.query<RowDataPacket[]>(
            `SELECT 
                s.id,
                s.full_name,
                s.roll_number,
                s.date_of_birth,
                u.email,
                c.grade,
                c.section,
                CONCAT(c.grade, ' ', c.section) as class_name
            FROM students s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN classes c ON s.class_id = c.id
            WHERE s.id = ?`,
            [studentId]
        );

        if (students.length === 0) {
            throw new Error('Student not found');
        }

        const student = students[0];

        // Get all portfolio entries
        const entries = await this.getAllPortfolioEntries(studentId);

        return {
            student,
            portfolioEntries: entries
        };
    }

    // Add new portfolio entry (teacher only adds, never edits)
    async addPortfolioEntry(data: {
        studentId: number;
        teacherId: number;
        performanceSummary: string;
        activitiesAchievements: string;
        areasImprovement: string;
        disciplineRemarks: string;
    }): Promise<any> {
        const [result] = await pool.query(
            `INSERT INTO portfolios 
            (student_id, teacher_id, performance_summary, activities_achievements, areas_improvement, discipline_remarks)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                data.studentId,
                data.teacherId,
                data.performanceSummary,
                data.activitiesAchievements,
                data.areasImprovement,
                data.disciplineRemarks
            ]
        );

        return { id: (result as any).insertId, ...data };
    }

    // Update portfolio entry (admin only)
    async updatePortfolioEntry(entryId: number, data: {
        performanceSummary?: string;
        activitiesAchievements?: string;
        areasImprovement?: string;
        disciplineRemarks?: string;
    }): Promise<any> {
        const updates: string[] = [];
        const values: any[] = [];

        if (data.performanceSummary !== undefined) {
            updates.push('performance_summary = ?');
            values.push(data.performanceSummary);
        }
        if (data.activitiesAchievements !== undefined) {
            updates.push('activities_achievements = ?');
            values.push(data.activitiesAchievements);
        }
        if (data.areasImprovement !== undefined) {
            updates.push('areas_improvement = ?');
            values.push(data.areasImprovement);
        }
        if (data.disciplineRemarks !== undefined) {
            updates.push('discipline_remarks = ?');
            values.push(data.disciplineRemarks);
        }

        if (updates.length === 0) {
            throw new Error('No fields to update');
        }

        values.push(entryId);

        await pool.query(
            `UPDATE portfolios SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        return { id: entryId, ...data };
    }

    // Get students by class for dropdown
    async getStudentsByClass(classId: number): Promise<any[]> {
        const [students] = await pool.query<RowDataPacket[]>(
            `SELECT 
                s.id,
                s.full_name,
                s.roll_number,
                CONCAT(c.grade, ' ', c.section) as class_name,
                c.grade,
                c.section
            FROM students s
            JOIN classes c ON s.class_id = c.id
            WHERE s.class_id = ?
            ORDER BY s.roll_number, s.full_name`,
            [classId]
        );
        return students;
    }

    // Get students filtered by grade and section (for admin)
    async getStudentsByFilter(grade?: string, section?: string): Promise<any[]> {
        let query = `
            SELECT 
                s.id,
                s.full_name,
                s.roll_number,
                CONCAT(c.grade, ' ', c.section) as class_name,
                c.grade,
                c.section
            FROM students s
            JOIN classes c ON s.class_id = c.id
        `;
        const params: any[] = [];

        if (grade && section) {
            query += ' WHERE c.grade = ? AND c.section = ?';
            params.push(grade, section);
        } else if (grade) {
            query += ' WHERE c.grade = ?';
            params.push(grade);
        }

        query += ' ORDER BY c.grade, c.section, s.roll_number, s.full_name';

        const [students] = await pool.query<RowDataPacket[]>(query, params);
        return students;
    }

    // Delete portfolio entry (admin only)
    async deletePortfolioEntry(entryId: number): Promise<void> {
        await pool.query('DELETE FROM portfolios WHERE id = ?', [entryId]);
    }
}

export const studentPortfolioService = new StudentPortfolioService();
