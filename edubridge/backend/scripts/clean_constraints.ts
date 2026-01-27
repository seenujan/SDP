
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function cleanConstraints() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'edubridge'
    });

    try {
        console.log('Cleaning constraints...');

        // Helper to drop constraint if exists
        const dropConstraint = async (name: string) => {
            try {
                await connection.query(`ALTER TABLE portfolios DROP FOREIGN KEY ${name}`);
                console.log(`Dropped ${name}`);
            } catch (e: any) {
                if (e.errno !== 1091) { // 1091 = Can't check if exists/not exists
                    console.log(`Could not drop ${name}: ${e.message}`);
                }
            }
        };

        // Drop known potential bad constraints
        await dropConstraint('fk_portfolio_teacher');
        await dropConstraint('fk_portfolios_teacher');
        await dropConstraint('fk_portfolios_teacher_v2');
        await dropConstraint('portfolios_teacher_id_foreign');
        await dropConstraint('portfolios_ibfk_1');

        // Add correct constraint
        console.log('Adding correct constraint fk_portfolios_teacher_final...');
        try {
            await connection.query('ALTER TABLE portfolios ADD CONSTRAINT fk_portfolios_teacher_final FOREIGN KEY (teacher_id) REFERENCES teachers(id)');
            console.log('Constraint added successfully.');
        } catch (e: any) {
            console.error('Failed to add constraint:', e.message);
        }

    } catch (error) {
        console.error('Clean failed:', error);
    } finally {
        await connection.end();
    }
}

cleanConstraints();
