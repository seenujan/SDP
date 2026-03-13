import { pool } from '../src/config/database';
import bcrypt from 'bcryptjs';

async function main() {
    console.log("Checking for subjects without a teacher...");

    // Get existing teachers and their subjects
    const [existingTeachers]: any = await pool.query('SELECT subject_id FROM teachers');
    const existingSubjectIds = existingTeachers.map((t: any) => t.subject_id).filter((id: any) => id != null);

    // Get all subjects
    const [allSubjects]: any = await pool.query('SELECT * FROM subjects');

    const missingSubjects = allSubjects.filter((s: any) => !existingSubjectIds.includes(s.id));

    if (missingSubjects.length === 0) {
        console.log("All subjects have at least one teacher. Nothing to do.");
        await pool.end();
        return;
    }

    console.log(`Found ${missingSubjects.length} missing subjects. Generating teachers...`);

    // Same password for all
    const hashedPassword = await bcrypt.hash('Password@123', 10);

    for (const subj of missingSubjects) {
        // e.g., teacher_environmental_studies@gmail.com
        const cleanName = subj.subject_name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const email = `teacher_${cleanName}${subj.id}@gmail.com`;
        const fullName = `Teacher ${subj.subject_name}`;

        // Check if user already exists
        let userId;
        const [existingUsers]: any = await pool.query('SELECT id FROM users WHERE email = ?', [email]);

        if (existingUsers.length > 0) {
            userId = existingUsers[0].id;
        } else {
            const [userResult]: any = await pool.query(
                'INSERT INTO users (email, password, role, active) VALUES (?, ?, ?, ?)',
                [email, hashedPassword, 'teacher', 1]
            );
            userId = userResult.insertId;
        }

        // Insert into teachers
        await pool.query(
            'INSERT INTO teachers (user_id, full_name, subject_id, phone) VALUES (?, ?, ?, ?)',
            [userId, fullName, subj.id, 'N/A']
        );
    }

    console.log("Successfully seeded missing teachers!");
    await pool.end();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
