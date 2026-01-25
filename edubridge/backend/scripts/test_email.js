const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testEmail() {
    console.log('Testing Email Configuration...');
    console.log('Host:', process.env.EMAIL_HOST);
    console.log('Port:', process.env.EMAIL_PORT);
    console.log('User:', process.env.EMAIL_USER);
    console.log('Secure:', process.env.EMAIL_SECURE);

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // true for 465
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        debug: true, // Enable debug output
        logger: true  // Log logic
    });

    try {
        console.log('Verifying transporter...');
        await transporter.verify();
        console.log('Transporter verified!');

        console.log('Sending test email...');
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: 'sllifeline35@gmail.com', // Send to user requested email
            subject: 'Test Email from EduBridge',
            text: 'If you receive this, the email configuration is working!',
        });

        console.log('Message sent: %s', info.messageId);
    } catch (error) {
        console.error('Error occurred:', error);
    }
}

testEmail();
