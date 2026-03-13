import { pool } from '../src/config/database';
import bcrypt from 'bcryptjs';

async function resetAllPasswords() {
    try {
        const newPassword = 'Password@123';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        console.log('Updating all user passwords to:', newPassword);

        const [result]: any = await pool.query(
            'UPDATE users SET password = ?',
            [hashedPassword]
        );

        console.log(`Successfully updated ${result.affectedRows} users.`);
    } catch (error) {
        console.error('Error resetting passwords:', error);
    } finally {
        await pool.end(); // Close the database connection pool
    }
}

resetAllPasswords();
