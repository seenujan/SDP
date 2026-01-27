import { pool } from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import crypto from 'crypto';
import { emailService } from './EmailService';
import { validatePassword } from '../utils/validators';

export class AuthService {
    // Login user
    async login(email: string, password: string) {
        try {
            // Find user by email
            const [rows]: any = await pool.query(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );

            if (rows.length === 0) {
                throw new Error('Invalid email or password');
            }

            const user = rows[0];



            // Verify password
            // Handle both legacy plain text and bcrypt hashed passwords
            let isPasswordValid = false;

            // Check if password looks like bcrypt hash (starts with $2a$ or $2b$)
            if (user.password.startsWith('$2')) {
                isPasswordValid = await bcrypt.compare(password, user.password);
            } else {
                // Fallback to plain text for legacy/dev data
                isPasswordValid = password === user.password;
            }

            if (!isPasswordValid) {
                throw new Error('Invalid email or password');
            }

            // Generate JWT token
            const token = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                } as jwt.JwtPayload,
                config.jwt.secret,
                { expiresIn: '7d' }
            );

            // Get role-specific data
            let roleData = null;
            if (user.role === 'student') {
                const [studentRows]: any = await pool.query(
                    'SELECT * FROM students WHERE user_id = ?',
                    [user.id]
                );
                roleData = studentRows[0];
            } else if (user.role === 'teacher') {
                const [teacherRows]: any = await pool.query(
                    'SELECT * FROM teachers WHERE user_id = ?',
                    [user.id]
                );
                roleData = teacherRows[0];
            } else if (user.role === 'parent') {
                const [parentRows]: any = await pool.query(
                    'SELECT * FROM parents WHERE user_id = ?',
                    [user.id]
                );
                roleData = parentRows[0];
            }

            return {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    active: user.active,
                    ...roleData,
                },
            };
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    // Hash password
    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, 10);
    }

    // Activate account
    async activateAccount(token: string, password: string) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Verify token
            const [tokenRows]: any = await connection.query(
                'SELECT user_id, expires_at FROM activation_tokens WHERE token = ?',
                [token]
            );

            if (tokenRows.length === 0) {
                throw new Error('Invalid activation token');
            }

            const { user_id, expires_at } = tokenRows[0];

            if (new Date() > new Date(expires_at)) {
                throw new Error('Activation token has expired');
            }

            // Validate password
            validatePassword(password);

            // Hash new password
            const hashedPassword = await this.hashPassword(password);

            // Update user password and set active = 1
            await connection.query(
                'UPDATE users SET password = ?, active = 1 WHERE id = ?',
                [hashedPassword, user_id]
            );

            // Mark token as used
            await connection.query(
                'UPDATE activation_tokens SET is_used = 1, used_at = NOW() WHERE token = ?',
                [token]
            );

            await connection.commit();
            return { success: true, message: 'Account activated successfully' };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
    // Verify activation token
    async verifyToken(token: string) {
        const connection = await pool.getConnection();
        try {
            const [tokenRows]: any = await connection.query(
                `SELECT u.email, t.is_used 
                 FROM activation_tokens t
                 JOIN users u ON t.user_id = u.id
                 WHERE t.token = ?`,
                [token]
            );

            if (tokenRows.length === 0) {
                // Also check password_resets table for verifyToken usage in reset password flow?
                // The current verifyToken is specifically looking at activation_tokens.
                // Reset password flow usually has its own verify step or we can reuse if we check both.
                // But let's keep them separate or add logic.
                // Actually, the prompt requirement was "verifyToken endpoint". 
                // Let's add a verifyResetToken if needed, but for now I'll just implement resetPassword which verifies implicitly.
                // Or I can add a specific method for verifying reset token if frontend needs to validate it on load.
                throw new Error('Invalid activation token');
            }

            // We could also check expiry here if we want to be strict before they try to submit
            // But main purpose is to get email.

            // Start checking is_used here for better UX, or let activateAccount fail? 
            // For verification feedback, it's better to know if it's already used.
            if (tokenRows[0].is_used === 1) {
                throw new Error('This activation link has already been used');
            }

            return { valid: true, email: tokenRows[0].email };
        } finally {
            connection.release();
        }
    }

    // Request password reset
    async requestPasswordReset(email: string) {
        // Check if user exists
        const [users]: any = await pool.query('SELECT id, email FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            throw new Error('User not found');
        }
        const user = users[0];

        // Generate token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // We keep existing reset history now. 
            // But we might want to invalidate pending ones? 
            // The requirement "history" implies keeping records. 
            // Let's just INSERT a new one. The old ones will expire or stay unused.
            // If strict security needed, we could mark previous PENDING ones as used/cancelled,
            // but simply inserting a new one is fine as long as we validate properly.

            // Save new token
            await connection.query(
                'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
                [user.id, token, expiresAt]
            );

            await connection.commit();

            // Send email
            await emailService.sendPasswordResetEmail(user.email, token);

            return { message: 'Password reset instructions sent to your email' };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Reset password
    async resetPassword(token: string, password: string) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Verify token
            const [rows]: any = await connection.query(
                'SELECT user_id, expires_at FROM password_resets WHERE token = ?',
                [token]
            );

            if (rows.length === 0) {
                throw new Error('Invalid or expired password reset token');
            }

            const { user_id, expires_at, is_used } = rows[0];

            if (is_used === 1) {
                throw new Error('This password reset link has already been used');
            }

            if (new Date() > new Date(expires_at)) {
                throw new Error('Password reset token has expired');
            }

            // Validate password
            validatePassword(password);

            // Hash new password
            const hashedPassword = await this.hashPassword(password);

            // Update user password
            await connection.query(
                'UPDATE users SET password = ? WHERE id = ?',
                [hashedPassword, user_id]
            );

            // Mark token as used
            await connection.query(
                'UPDATE password_resets SET is_used = 1, used_at = NOW() WHERE token = ?',
                [token]
            );

            await connection.commit();
            return { message: 'Password reset successfully' };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

export const authService = new AuthService();
