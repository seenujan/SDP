import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: process.env.PORT || 5000,
    database: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '#Seenu2003',
        database: process.env.DB_NAME || 'school_management',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'edubridge_secret_key',
        expiresIn: '7d',
    },
    email: {
        host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || '',
        secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        from: process.env.EMAIL_FROM || '"EduBridge Admin" <admin@edubridge.com>',
    }
};
