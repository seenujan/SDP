import { pool } from '../config/database';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { emailService } from './EmailService';
import { validatePassword } from '../utils/validators';

export class UserService {
    // Create a new user with role-specific data
    async createUser(userData: {
        email: string;
        password?: string;
        role: 'admin' | 'teacher' | 'student' | 'parent';
        fullName: string;
        additionalData?: any;
    }) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();


            // Insert into users table
            // Password can be null (for admin-created accounts) or provided (for legacy/seed)
            // Active is 0 by default for admin-created (unless password provided, then maybe active?)
            // If password is NULL, active MUST be 0.
            let password = userData.password || null;
            const active = userData.password ? 1 : 0; // If password provided (e.g. seed), assume active. If not, inactive.

            if (password) {
                validatePassword(password);
                password = await bcrypt.hash(password, 10);
            }

            const [userResult]: any = await connection.query(
                'INSERT INTO users (email, password, role, active) VALUES (?, ?, ?, ?)',
                [userData.email, password, userData.role, active]
            );

            const userId = userResult.insertId;

            // Insert into role-specific table
            if (userData.role === 'student') {
                // Lookup class_id from grade and section
                const grade = userData.additionalData?.grade || '';
                const section = userData.additionalData?.section || '';

                let classId = null;
                let rollNumber = null;

                if (grade && section) {
                    const [classRows]: any = await connection.query(
                        'SELECT id FROM classes WHERE grade = ? AND section = ?',
                        [grade, section]
                    );
                    if (classRows.length > 0) {
                        classId = classRows[0].id;

                        // Generate roll number: GradeSection-Number
                        // Example: Grade 4 Section B → "4B-01"
                        const gradeNumber = grade.replace('Grade ', '');
                        const prefix = `${gradeNumber}${section}`;

                        // Count existing students in this class to get next number
                        const [countResult]: any = await connection.query(
                            'SELECT COUNT(*) as count FROM students WHERE class_id = ?',
                            [classId]
                        );
                        const nextNumber = (countResult[0].count + 1).toString().padStart(2, '0');
                        rollNumber = `${prefix}-${nextNumber}`;
                    } else {
                        throw new Error(`Class not found for ${grade} Section ${section}. Please create the class first.`);
                    }
                }

                await connection.query(
                    'INSERT INTO students (user_id, full_name, roll_number, class_id, date_of_birth, parent_id) VALUES (?, ?, ?, ?, ?, ?)',
                    [
                        userId,
                        userData.fullName,
                        rollNumber,
                        classId,
                        userData.additionalData?.dateOfBirth || null,
                        userData.additionalData?.parentId || null,
                    ]
                );
            } else if (userData.role === 'teacher') {
                await connection.query(
                    'INSERT INTO teachers (user_id, full_name, subject_id, phone) VALUES (?, ?, ?, ?)',
                    [userId, userData.fullName, userData.additionalData?.subjectId || null, userData.additionalData?.phone || null]
                );
            } else if (userData.role === 'parent') {
                await connection.query(
                    'INSERT INTO parents (user_id, full_name, phone) VALUES (?, ?, ?)',
                    [userId, userData.fullName, userData.additionalData?.phone || '']
                );
            }

            // Generate activation token if inactive
            if (active === 0) {
                const token = crypto.randomBytes(32).toString('hex');
                const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

                await connection.query(
                    'INSERT INTO activation_tokens (token, user_id, expires_at) VALUES (?, ?, ?)',
                    [token, userId, expiresAt]
                );

                // Send activation email
                // We do this AFTER commit usually, but if it fails we might want to know.
                // But we can't rollback email.
                // Let's do it after commit logic, but here we are inside function.
                // We'll trust EmailService to log error but not fail the transaction, OR fail it?
                // Plan says "Send activation email".
                try {
                    await emailService.sendActivationEmail(userData.email, token);
                } catch (emailError) {
                    console.error('Failed to send activation email:', emailError);
                    // Decide if we should rollback user creation. User probably wants to know.
                    // But if we rollback, we lose the trace.
                    // Let's keep the user but maybe warn.
                    // For now, allow it.
                }
            }

            await connection.commit();
            return { id: userId, email: userData.email, role: userData.role, fullName: userData.fullName };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Get all users with their details
    async getAllUsers() {
        const [rows] = await pool.query(`
            SELECT 
                u.id, u.email, u.role, u.active, u.created_at,
                COALESCE(t.full_name, s.full_name, p.full_name) as full_name,
                sub.subject_name as subject,
                c.grade, c.section, s.date_of_birth, s.parent_id, s.class_id,
                COALESCE(p.phone, t.phone) as phone
            FROM users u
            LEFT JOIN teachers t ON u.id = t.user_id
            LEFT JOIN subjects sub ON t.subject_id = sub.id
            LEFT JOIN students s ON u.id = s.user_id
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN parents p ON u.id = p.user_id
            ORDER BY u.created_at DESC
        `);
        return rows;
    }

    // Get user by ID with role-specific data
    async getUserById(id: number) {
        const [rows]: any = await pool.query(
            `SELECT 
                u.id, u.email, u.role, u.active, u.created_at,
                COALESCE(t.full_name, s.full_name, p.full_name) as full_name,
                sub.subject_name as subject, t.subject_id, t.id as teacher_id,
                c.grade, c.section, s.date_of_birth, s.parent_id, s.class_id, s.id as student_id,
                COALESCE(p.phone, t.phone) as phone, p.id as parent_id_record
            FROM users u
            LEFT JOIN teachers t ON u.id = t.user_id
            LEFT JOIN subjects sub ON t.subject_id = sub.id
            LEFT JOIN students s ON u.id = s.user_id
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN parents p ON u.id = p.user_id
            WHERE u.id = ?`,
            [id]
        );
        return rows[0] || null;
    }

    // Update user
    async updateUser(id: number, userData: {
        email?: string;
        password?: string;
        fullName?: string;
        active?: boolean;
        additionalData?: any;
    }) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Get current user role
            const [userRows]: any = await connection.query('SELECT role FROM users WHERE id = ?', [id]);
            if (userRows.length === 0) throw new Error('User not found');
            const role = userRows[0].role;

            // Update users table
            if (userData.email || userData.password || userData.active !== undefined) {
                const updates: string[] = [];
                const values: any[] = [];

                if (userData.email) {
                    updates.push('email = ?');
                    values.push(userData.email);
                }
                if (userData.password) {
                    validatePassword(userData.password);
                    updates.push('password = ?');
                    values.push(await bcrypt.hash(userData.password, 10));
                }
                if (userData.active !== undefined) {
                    updates.push('active = ?');
                    values.push(userData.active ? 1 : 0);
                }

                if (updates.length > 0) {
                    values.push(id);
                    await connection.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
                }
            }

            // Update role-specific table
            if (role === 'student' && (userData.fullName || userData.additionalData)) {
                const updates: string[] = [];
                const values: any[] = [];

                if (userData.fullName) { updates.push('full_name = ?'); values.push(userData.fullName); }

                // Handle grade/section -> class_id lookup
                const grade = userData.additionalData?.grade;
                const section = userData.additionalData?.section;
                if (grade && section) {
                    const [classRows]: any = await connection.query(
                        'SELECT id FROM classes WHERE grade = ? AND section = ?',
                        [grade, section]
                    );
                    if (classRows.length > 0) {
                        updates.push('class_id = ?');
                        values.push(classRows[0].id);
                    }
                }

                if (userData.additionalData?.dateOfBirth) { updates.push('date_of_birth = ?'); values.push(userData.additionalData.dateOfBirth); }
                if (userData.additionalData?.parentId !== undefined) { updates.push('parent_id = ?'); values.push(userData.additionalData.parentId || null); }

                if (updates.length > 0) {
                    values.push(id);
                    await connection.query(`UPDATE students SET ${updates.join(', ')} WHERE user_id = ?`, values);
                }
            } else if (role === 'teacher' && (userData.fullName || userData.additionalData)) {
                const updates: string[] = [];
                const values: any[] = [];

                if (userData.fullName) { updates.push('full_name = ?'); values.push(userData.fullName); }
                if (userData.additionalData?.subjectId) { updates.push('subject_id = ?'); values.push(userData.additionalData.subjectId); }
                if (userData.additionalData?.phone) { updates.push('phone = ?'); values.push(userData.additionalData.phone); }

                if (updates.length > 0) {
                    values.push(id);
                    await connection.query(`UPDATE teachers SET ${updates.join(', ')} WHERE user_id = ?`, values);
                }
            } else if (role === 'parent' && (userData.fullName || userData.additionalData)) {
                const updates: string[] = [];
                const values: any[] = [];

                if (userData.fullName) { updates.push('full_name = ?'); values.push(userData.fullName); }
                if (userData.additionalData?.phone) { updates.push('phone = ?'); values.push(userData.additionalData.phone); }

                if (updates.length > 0) {
                    values.push(id);
                    await connection.query(`UPDATE parents SET ${updates.join(', ')} WHERE user_id = ?`, values);
                }
            }

            await connection.commit();
            return await this.getUserById(id);
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Delete user (cascades to role-specific tables)
    async deleteUser(id: number) {
        await pool.query('DELETE FROM users WHERE id = ?', [id]);
        return { success: true, message: 'User deleted successfully' };
    }

    // Get students with class info
    async getStudents() {
        const [rows] = await pool.query(`
            SELECT 
                s.id, s.user_id, s.full_name, s.roll_number, s.class_id, s.date_of_birth, s.parent_id,
                c.grade, c.section,
                u.email, u.active, u.created_at,
                p.full_name as parent_name
            FROM students s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN parents p ON s.parent_id = p.user_id
            ORDER BY c.grade, c.section, s.roll_number, s.full_name
        `);
        return rows;
    }

    // Get teachers
    async getTeachers() {
        const [rows] = await pool.query(`
            SELECT 
                t.id, t.user_id, t.full_name, t.phone, t.subject_id, s.subject_name as subject,
                u.email, u.active, u.created_at
            FROM teachers t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN subjects s ON t.subject_id = s.id
            ORDER BY t.full_name
        `);
        return rows;
    }

    // Get parents
    async getParents() {
        const [rows] = await pool.query(`
            SELECT 
                p.id, p.user_id, p.full_name, p.phone,
                u.email, u.active, u.created_at
            FROM parents p
            JOIN users u ON p.user_id = u.id
            ORDER BY p.full_name
        `);
        return rows;
    }

    // Get parents for dropdown (when creating students)
    async getParentsForDropdown() {
        const [rows] = await pool.query(`
            SELECT p.user_id as id, p.full_name, u.email
            FROM parents p
            JOIN users u ON p.user_id = u.id
            ORDER BY p.full_name
        `);
        return rows;
    }

    // Get all classes for dropdown
    async getClasses() {
        const [rows] = await pool.query(`
            SELECT c.id, c.grade, c.section
            FROM classes c
            ORDER BY CAST(SUBSTRING(c.grade, 7) AS UNSIGNED), c.section
        `);
        return rows;
    }

    // Get available grades (distinct)
    async getAvailableGrades() {
        const [rows] = await pool.query(`
            SELECT DISTINCT grade FROM classes ORDER BY grade
        `);
        return rows;
    }

    // Get sections for a specific grade
    async getSectionsForGrade(grade: string) {
        const [rows] = await pool.query(`
            SELECT section FROM classes WHERE grade = ? ORDER BY section
        `, [grade]);
        return rows;
    }

    // Update user's own profile
    async updateProfile(userId: number, profileData: {
        fullName?: string;
        email?: string;
        phone?: string;
        subjectId?: number;
        dateOfBirth?: string;
    }) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Get user role
            const [userRows]: any = await connection.query('SELECT role FROM users WHERE id = ?', [userId]);
            if (userRows.length === 0) throw new Error('User not found');
            const role = userRows[0].role;

            // Update email in users table
            if (profileData.email) {
                await connection.query('UPDATE users SET email = ? WHERE id = ?', [profileData.email, userId]);
            }

            // Update role-specific table
            if (role === 'student') {
                const updates: string[] = [];
                const values: any[] = [];

                if (profileData.fullName) { updates.push('full_name = ?'); values.push(profileData.fullName); }
                if (profileData.dateOfBirth) { updates.push('date_of_birth = ?'); values.push(profileData.dateOfBirth); }

                if (updates.length > 0) {
                    values.push(userId);
                    await connection.query(`UPDATE students SET ${updates.join(', ')} WHERE user_id = ?`, values);
                }
            } else if (role === 'teacher') {
                const updates: string[] = [];
                const values: any[] = [];

                if (profileData.fullName) { updates.push('full_name = ?'); values.push(profileData.fullName); }
                if (profileData.subjectId) { updates.push('subject_id = ?'); values.push(profileData.subjectId); }
                if (profileData.phone) { updates.push('phone = ?'); values.push(profileData.phone); }

                if (updates.length > 0) {
                    values.push(userId);
                    await connection.query(`UPDATE teachers SET ${updates.join(', ')} WHERE user_id = ?`, values);
                }
            } else if (role === 'parent') {
                const updates: string[] = [];
                const values: any[] = [];

                if (profileData.fullName) { updates.push('full_name = ?'); values.push(profileData.fullName); }
                if (profileData.phone) { updates.push('phone = ?'); values.push(profileData.phone); }

                if (updates.length > 0) {
                    values.push(userId);
                    await connection.query(`UPDATE parents SET ${updates.join(', ')} WHERE user_id = ?`, values);
                }
            }

            await connection.commit();
            return await this.getUserById(userId);
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Change user's password
    async changePassword(userId: number, currentPassword: string, newPassword: string) {
        const connection = await pool.getConnection();
        try {
            // Verify current password
            const [userRows]: any = await connection.query(
                'SELECT password FROM users WHERE id = ?',
                [userId]
            );

            if (userRows.length === 0) throw new Error('User not found');

            // Verify current password (handle both plain text and bcrypt for backward compatibility)
            // Ideally we should move everyone to bcrypt, but for now we check both.
            let isPasswordValid = false;

            if (userRows[0].password.startsWith('$2')) {
                isPasswordValid = await bcrypt.compare(currentPassword, userRows[0].password);
            } else {
                isPasswordValid = userRows[0].password === currentPassword;
                // Optional: Upgrade password if it matches plain text? 
                // We will do that when we save the new one anyway.
            }

            if (!isPasswordValid) {
                throw new Error('Current password is incorrect');
            }

            // Validate new password rules
            validatePassword(newPassword);

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update password
            await connection.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

            return { success: true, message: 'Password changed successfully' };
        } finally {
            connection.release();
        }
    }
}

export const userService = new UserService();
