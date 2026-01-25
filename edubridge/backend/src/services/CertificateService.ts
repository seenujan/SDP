import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class CertificateService {
    // Get all certificates with student and issuer information
    async getAllCertificates(): Promise<any[]> {
        const [certificates] = await pool.query<RowDataPacket[]>(
            `SELECT 
                c.*,
                s.full_name as student_name,
                s.roll_number,
                CONCAT(cl.grade, ' ', cl.section) as class_name,
                COALESCE(t.full_name, st.full_name, p.full_name, u.email) as issued_by_name
            FROM certificates c
            JOIN students s ON c.student_id = s.id
            LEFT JOIN classes cl ON s.class_id = cl.id
            LEFT JOIN users u ON c.issued_by = u.id
            LEFT JOIN teachers t ON u.id = t.user_id
            LEFT JOIN students st ON u.id = st.user_id
            LEFT JOIN parents p ON u.id = p.user_id
            ORDER BY c.created_at DESC`
        );
        return certificates;
    }

    // Get certificates for a specific student
    async getCertificatesByStudent(studentId: number): Promise<any[]> {
        const [certificates] = await pool.query<RowDataPacket[]>(
            `SELECT 
                c.*,
                COALESCE(t.full_name, s.full_name, p.full_name, u.email) as issued_by_name
            FROM certificates c
            LEFT JOIN users u ON c.issued_by = u.id
            LEFT JOIN teachers t ON u.id = t.user_id
            LEFT JOIN students s ON u.id = s.user_id
            LEFT JOIN parents p ON u.id = p.user_id
            WHERE c.student_id = ?
            ORDER BY c.issue_date DESC`,
            [studentId]
        );
        return certificates;
    }

    // Create a new certificate
    async createCertificate(data: {
        studentId: number;
        certificateType: string;
        title: string;
        description?: string;
        issueDate: string;
        issuedBy: number;
    }): Promise<any> {
        const certificateNumber = await this.generateCertificateNumber();

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO certificates 
            (student_id, certificate_type, title, description, issue_date, certificate_number, issued_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                data.studentId,
                data.certificateType,
                data.title,
                data.description || null,
                data.issueDate,
                certificateNumber,
                data.issuedBy
            ]
        );

        // Fetch and return the created certificate
        const [certificate] = await pool.query<RowDataPacket[]>(
            `SELECT 
                c.*,
                s.full_name as student_name,
                s.roll_number,
                CONCAT(cl.grade, ' ', cl.section) as class_name,
                COALESCE(t.full_name, st.full_name, p.full_name, u.email) as issued_by_name
            FROM certificates c
            JOIN students s ON c.student_id = s.id
            LEFT JOIN classes cl ON s.class_id = cl.id
            LEFT JOIN users u ON c.issued_by = u.id
            LEFT JOIN teachers t ON u.id = t.user_id
            LEFT JOIN students st ON u.id = st.user_id
            LEFT JOIN parents p ON u.id = p.user_id
            WHERE c.id = ?`,
            [result.insertId]
        );

        return certificate[0];
    }

    // Delete a certificate
    async deleteCertificate(id: number): Promise<void> {
        await pool.query(
            'DELETE FROM certificates WHERE id = ?',
            [id]
        );
    }

    // Generate unique certificate number
    async generateCertificateNumber(): Promise<string> {
        const year = new Date().getFullYear();

        // Get count of certificates issued this year
        const [result] = await pool.query<RowDataPacket[]>(
            `SELECT COUNT(*) as count 
            FROM certificates 
            WHERE YEAR(issue_date) = ?`,
            [year]
        );

        const count = result[0].count + 1;
        const paddedCount = String(count).padStart(4, '0');

        return `CERT-${year}-${paddedCount}`;
    }

    // Get certificate statistics
    async getCertificateStats(): Promise<any> {
        const [stats] = await pool.query<RowDataPacket[]>(
            `SELECT 
                COUNT(*) as total_certificates,
                COUNT(DISTINCT student_id) as total_students,
                certificate_type,
                COUNT(*) as count
            FROM certificates
            GROUP BY certificate_type`
        );
        return stats;
    }
}

export default new CertificateService();
