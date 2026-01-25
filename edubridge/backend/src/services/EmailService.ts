import nodemailer from 'nodemailer';
import { config } from '../config/environment';

export class EmailService {
    private transporter;

    constructor() {
        // Use environment variables for email config
        // If not provided, we can fall back to a console logger for development (or ethereal)
        if (config.email.host) {
            this.transporter = nodemailer.createTransport({
                host: config.email.host,
                port: config.email.port,
                secure: config.email.secure, // true for 465, false for other ports
                auth: {
                    user: config.email.user,
                    pass: config.email.pass,
                },
            });
        } else {
            console.warn('⚠️ No email configuration found. Emails will be logged to console.');
        }
    }

    async sendActivationEmail(to: string, token: string) {
        const activationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/activate?token=${token}`;

        const mailOptions = {
            from: config.email.from || '"EduBridge Admin" <admin@edubridge.com>',
            to,
            subject: 'Activate Your EduBridge Account',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Welcome to EduBridge!</h2>
                    <p>Your account has been created. Please click the button below to set your password and activate your account.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${activationLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Activate Account</a>
                    </div>
                    <p>Or copy and paste this link into your browser:</p>
                    <p>${activationLink}</p>
                    <p>This link will expire in 24 hours.</p>
                </div>
            `,
        };

        return this.sendMail(mailOptions, to, activationLink, 'Initial Activation');
    }

    async sendPasswordResetEmail(to: string, token: string) {
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

        const mailOptions = {
            from: config.email.from || '"EduBridge Admin" <admin@edubridge.com>',
            to,
            subject: 'Reset Your EduBridge Password',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Password Reset Request</h2>
                    <p>You requested a password reset. Please click the button below to reset your password.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="background-color: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
                    </div>
                    <p>Or copy and paste this link into your browser:</p>
                    <p>${resetLink}</p>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you did not request this, please ignore this email.</p>
                </div>
            `,
        };

        return this.sendMail(mailOptions, to, resetLink, 'Password Reset');
    }

    private async sendMail(mailOptions: any, to: string, link: string, type: string) {
        if (this.transporter) {
            try {
                const info = await this.transporter.sendMail(mailOptions);
                console.log(`📧 ${type} email sent:`, info.messageId);
                return info;
            } catch (error) {
                console.error('❌ Error sending email:', error);
                throw error;
            }
        } else {
            console.log(`📧 [MOCK EMAIL - ${type}] To:`, to);
            console.log('🔗 Link:', link);
            return { messageId: 'mock-id' };
        }
    }
}

export const emailService = new EmailService();
