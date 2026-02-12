
import { pool } from '../src/config/database';

async function migrate() {
    console.log('Starting Leave Management Migration...');
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Create leave_types table
        console.log('Creating leave_types table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS leave_types (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) NOT NULL UNIQUE,
                default_annual_quota INT NOT NULL DEFAULT 0,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Seed leave_types
        // Casual: 21 days, Medical: 0 (Unlimited but tracked), Duty: 0 (Unlimited), Short: 2 (Per Month, handled by logic)
        console.log('Seeding leave_types...');
        const leaveTypes = [
            ['Casual', 21, 'Annual casual leave entitlement'],
            ['Medical', 0, 'Medical leave (Requires MC for >2 days)'],
            ['Duty', 0, 'Official duty leave'],
            ['Short', 0, 'Short leave (90 mins, max 2 per month)']
        ];

        for (const [name, quota, desc] of leaveTypes) {
            await connection.query(`
                INSERT INTO leave_types (name, default_annual_quota, description)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE default_annual_quota = VALUES(default_annual_quota), description = VALUES(description)
            `, [name, quota, desc]);
        }

        // 3. Create teacher_leaves table
        console.log('Creating teacher_leaves table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS teacher_leaves (
                id INT AUTO_INCREMENT PRIMARY KEY,
                teacher_id INT NOT NULL,
                leave_type_id INT NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                is_half_day BOOLEAN DEFAULT FALSE,
                reason TEXT NOT NULL,
                relief_teacher_id INT NOT NULL,
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                rejection_reason TEXT,
                approved_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
                FOREIGN KEY (relief_teacher_id) REFERENCES users(id),
                FOREIGN KEY (approved_by) REFERENCES users(id)
            );
        `);

        await connection.commit();
        console.log('✅ Migration completed successfully!');

    } catch (error) {
        await connection.rollback();
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        connection.release();
        process.exit(0);
    }
}

migrate();
