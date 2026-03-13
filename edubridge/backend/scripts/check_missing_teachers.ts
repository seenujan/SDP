import { pool } from '../src/config/database';

async function main() {
    console.log("Fetching subjects without a teacher...");

    // Check existing teachers and their subjects
    const [existingTeachers]: any = await pool.query(`
        SELECT t.subject_id, s.subject_name 
        FROM teachers t
        JOIN subjects s ON t.subject_id = s.id
    `);

    const existingSubjectIds = existingTeachers.map((t: any) => t.subject_id);

    // Get all subjects
    const [allSubjects]: any = await pool.query('SELECT * FROM subjects');

    const missingSubjects = allSubjects.filter((s: any) => !existingSubjectIds.includes(s.id));

    console.log("Missing subjects:", missingSubjects.map((s: any) => s.subject_name));

    console.log("\nUsers table structure:");
    const [usersDesc]: any = await pool.query("DESCRIBE users");
    console.log(usersDesc);

    console.log("\nTeachers table structure:");
    const [teachersDesc]: any = await pool.query("DESCRIBE teachers");
    console.log(teachersDesc);

    await pool.end();
}

main().catch(console.error);
