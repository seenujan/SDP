import dotenv from 'dotenv';
import path from 'path';

// Force load .env from backend root
dotenv.config({ path: path.join(__dirname, '../.env') });

import { userService } from '../src/services/UserService';
import { pool } from '../src/config/database';

async function verifyRegistration() {
    try {
        console.log('Starting Verification...');

        // 1. Get a valid class for student
        const [classes]: any = await pool.query('SELECT * FROM classes LIMIT 1');
        if (classes.length === 0) {
            console.error('No classes found. Cannot verify student creation.');
            return;
        }
        const cls = classes[0];
        console.log(`Using Class: ${cls.grade} ${cls.section} (ID: ${cls.id})`);

        const unique = Date.now();

        // 2. Create Parent
        console.log('--- Creating Parent ---');
        const parentData = {
            email: `parent_${unique}@test.com`,
            role: 'parent' as 'parent',
            fullName: 'Verify Parent',
            password: 'password123',
            additionalData: {
                phone: '555-0199'
            }
        };
        const parentUser = await userService.createUser(parentData);
        console.log(`Parent User Created: ID ${parentUser.id}`);

        // 3. Create Student
        console.log('--- Creating Student ---');
        const studentData = {
            email: `student_${unique}@test.com`,
            role: 'student' as 'student',
            fullName: 'Verify Student',
            password: 'password123',
            additionalData: {
                grade: cls.grade,
                section: cls.section,
                dateOfBirth: '2015-01-01',
                parentId: parentUser.id // Link to new parent (using user_id as parent_id expected by service? No, service expects parent_id to be user_id of parent)
                // Let's check UserService logic: 
                // if (userData.additionalData?.parentId !== undefined) { ... values.push(userData.additionalData.parentId || null); }
                // So yes, we pass the ID.
            }
        };
        const studentUser = await userService.createUser(studentData);
        console.log(`Student User Created: ID ${studentUser.id}`);

        // 4. Verify Database
        console.log('--- Database Verification ---');

        // Check Parent
        const [pRows]: any = await pool.query(
            'SELECT * FROM parents WHERE user_id = ?',
            [parentUser.id]
        );
        console.log(`Parent Record (parents table): ${pRows.length > 0 ? 'FOUND' : 'MISSING'}`);
        if (pRows.length > 0) console.log(pRows[0]);

        // Check Student
        const [sRows]: any = await pool.query(
            'SELECT * FROM students WHERE user_id = ?',
            [studentUser.id]
        );
        console.log(`Student Record (students table): ${sRows.length > 0 ? 'FOUND' : 'MISSING'}`);
        if (sRows.length > 0) console.log(sRows[0]);

        if (pRows.length > 0 && sRows.length > 0) {
            console.log('\n✅ VERIFICATION SUCCESSFUL: Both Student and Parent records created correctly.');
        } else {
            console.error('\n❌ VERIFICATION FAILED: Missing records.');
        }

    } catch (error) {
        console.error('Verification Error:', error);
    } finally {
        await pool.end();
    }
}

verifyRegistration();
