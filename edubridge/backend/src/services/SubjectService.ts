import { pool } from '../config/database';

export class SubjectService {
    async getAllSubjects() {
        const [rows] = await pool.query('SELECT * FROM subjects ORDER BY subject_name');
        return rows;
    }
}

export const subjectService = new SubjectService();
