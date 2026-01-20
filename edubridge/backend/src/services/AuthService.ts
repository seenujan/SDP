import { pool } from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';

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

            // Verify password (plain text comparison for existing database)
            const isPasswordValid = password === user.password;

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
}

export const authService = new AuthService();
