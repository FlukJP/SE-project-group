import nodemailer from 'nodemailer';
import { ENV } from '../config/env';

// Nodemailer transport configured with Gmail credentials from environment variables.
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, 
    requireTLS: true,
    auth: {
        user: ENV.EMAIL_USER,
        pass: ENV.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Sends an email with the given recipient, subject, and plain-text body.
export const sendEmail = async (to: string, subject: string, text: string) => {
    const mailOptions = {
        from: `"${ENV.EMAIL_USER}" <${ENV.EMAIL_USER}>`,
        to,
        subject,
        text,
    };
    await transporter.sendMail(mailOptions);
};
