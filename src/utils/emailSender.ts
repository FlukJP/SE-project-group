import nodemailer from 'nodemailer';
import { ENV } from '../config/env';

// Nodemailer transport configured with Gmail credentials from environment variables.
let transporter: nodemailer.Transporter | null = null;

const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: ENV.EMAIL_USER,
            pass: ENV.EMAIL_PASS, // ต้องเป็น App Password
        },
        connectionTimeout: 10000, // 10s
    });
};

export const getTransporter = () => {
    if (!transporter) {
        transporter = createTransporter();
    }
    return transporter;
};

// Verify connection ตอนเริ่ม server (optional)
export const verifyEmailConfig = async () => {
    try {
        const t = getTransporter();
        await t.verify();
        console.log('[Email] SMTP connection verified');
        return true;
    } catch (error) {
        console.error('[Email] SMTP verification failed');

        if (error instanceof Error) {
            console.error(error.message);

            if (error.message.includes('Invalid login')) {
                console.error('[Email] ตรวจสอบ App Password หรือ EMAIL_USER/EMAIL_PASS');
            }
        }

        console.error(JSON.stringify(error, null, 2));
        return false;
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
type SendEmailOptions = {
    to: string;
    subject: string;
    text?: string;
    html?: string; 
};

export const sendEmail = async ({
    to,
    subject,
    text,
    html,
}: SendEmailOptions) => {
    if (!ENV.EMAIL_USER || !ENV.EMAIL_PASS) throw new Error('Email credentials not configured');
    try {
        const info = await getTransporter().sendMail({
            from: `"Marketplace" <${ENV.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
        });
        console.log(`[Email] Sent to ${to}: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error('[Email] Failed to send');

        if (error instanceof Error) {
            console.error(error.message);

            if (error.message.includes('Invalid login')) console.error('👉 ใช้ App Password หรือยัง?');
            if (error.message.includes('ETIMEDOUT')) console.error('👉 Network / Firewall problem');
        }
        console.error(JSON.stringify(error, null, 2));
        throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
};
