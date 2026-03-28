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
};

export const sendEmailWithRetry = async (
    options: SendEmailOptions,
    maxRetries = 3
) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await sendEmail(options);
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            const delay = 1000 * Math.pow(2, i); // 1s, 2s, 4s
            console.warn(`[Email] Retry ${i + 1} in ${delay}ms`);
            await new Promise((r) => setTimeout(r, delay));
        }
    }
};

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
