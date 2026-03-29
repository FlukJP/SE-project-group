import nodemailer from "nodemailer";
import { ENV } from "../config/env";

// TYPES
export type SendEmailOptions = {
    to: string;
    subject: string;
    text?: string;
    html?: string;
};

type EmailResult = Awaited<ReturnType<nodemailer.Transporter["sendMail"]>>;

// TRANSPORTER SINGLETON
let transporter: nodemailer.Transporter | null = null;

const createTransporter = (): nodemailer.Transporter => {
    return nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: ENV.EMAIL_USER,
            pass: ENV.EMAIL_PASS,
        },
        connectionTimeout: 10_000,
    });
};

export const getTransporter = (): nodemailer.Transporter => {
    if (!transporter) {
        transporter = createTransporter();
    }
    return transporter;
};

// The function sets the variable `transporter` to `null`.
const resetTransporter = (): void => {
    transporter = null;
};

// ERROR HELPER
const formatEmailError = (error: unknown): string => {
    if (!(error instanceof Error)) return "Unknown error";

    const msg = error.message;

    if (msg.includes("Invalid login") || msg.includes("535")) {
        return `Auth failed — ตรวจสอบ EMAIL_USER และ App Password (${msg})`;
    }
    if (msg.includes("ETIMEDOUT") || msg.includes("ECONNREFUSED")) {
        return `Network error — ตรวจสอบ firewall หรือ SMTP host (${msg})`;
    }
    if (msg.includes("ENOTFOUND")) {
        return `DNS error — ไม่พบ smtp.gmail.com ตรวจสอบ internet connection (${msg})`;
    }

    return msg;
};

// VERIFY CONNECTION
export const verifyEmailConfig = async (): Promise<boolean> => {
    try {
        await getTransporter().verify();
        console.log("[Email] SMTP connection verified");
        return true;
    } catch (error) {
        const reason = formatEmailError(error);
        console.error(`[Email] SMTP verification failed: ${reason}`);
        // reset เพื่อให้ครั้งถัดไป create transporter ใหม่
        resetTransporter();
        return false;
    }
};

// SEND EMAIL (core)
export const sendEmail = async ({
    to,
    subject,
    text,
    html,
}: SendEmailOptions): Promise<EmailResult> => {
    const resolvedText = text ?? "No content";
    const resolvedHtml = html ?? `<p>${resolvedText}</p>`;

    try {
        const info = await getTransporter().sendMail({
            from: `"Marketplace" <${ENV.EMAIL_USER}>`,
            to,
            subject,
            text: resolvedText,
            html: resolvedHtml,
        });

        console.log(`[Email] Sent to ${to} — messageId: ${info.messageId}`);
        return info;
    } catch (error) {
        const reason = formatEmailError(error);
        console.error(`[Email] Failed to send to ${to}: ${reason}`);

        if (
            error instanceof Error &&
            (error.message.includes("Invalid login") ||
                error.message.includes("ETIMEDOUT") ||
                error.message.includes("ECONNREFUSED"))
        ) {
            resetTransporter();
        }

        throw new Error(`Failed to send email to "${to}": ${reason}`);
    }
};

// SEND WITH RETRY
export const sendEmailWithRetry = async (
    options: SendEmailOptions,
    maxRetries = 3
): Promise<EmailResult> => {
    let lastError: unknown;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await sendEmail(options);
        } catch (error) {
            lastError = error;

            if (attempt < maxRetries - 1) {
                const delay = 1000 * Math.pow(2, attempt);
                console.warn(
                    `[Email] Attempt ${attempt + 1}/${maxRetries} failed — retrying in ${delay}ms`
                );
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }

    console.error(`[Email] All ${maxRetries} attempts failed`);
    throw lastError;
};