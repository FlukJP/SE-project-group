import { Resend } from "resend";
import { SERVER_ENV as ENV } from "../config/env";

export type SendEmailOptions = {
    to: string;
    subject: string;
    text?: string;
    html?: string;
};

type EmailResult = {
    id: string;
};

let resendClient: Resend | null = null;

const getResendClient = (): Resend => {
    if (!ENV.RESEND_API_KEY) {
        throw new Error("RESEND_API_KEY is not configured");
    }

    if (!resendClient) {
        resendClient = new Resend(ENV.RESEND_API_KEY);
    }

    return resendClient;
};

const formatEmailError = (error: unknown): string => {
    if (error && typeof error === "object" && "message" in error) {
        const message = String((error as { message: unknown }).message);

        if (message.includes("API key")) {
            return `Resend authentication failed (${message})`;
        }

        if (
            message.includes("rate limit") ||
            message.includes("429") ||
            message.includes("quota")
        ) {
            return `Resend rate limit exceeded (${message})`;
        }

        return message;
    }

    return "Unknown error";
};

export const verifyEmailConfig = async (): Promise<boolean> => {
    try {
        if (!ENV.RESEND_API_KEY || !ENV.EMAIL_FROM) {
            throw new Error("RESEND_API_KEY or EMAIL_FROM is not configured");
        }

        getResendClient();
        console.log("[Email] Resend client configured");
        return true;
    } catch (error) {
        const reason = formatEmailError(error);
        console.error(`[Email] Resend configuration failed: ${reason}`);
        return false;
    }
};

export const sendEmail = async ({
    to,
    subject,
    text,
    html,
}: SendEmailOptions): Promise<EmailResult> => {
    const resolvedText = text ?? "No content";
    const resolvedHtml = html ?? `<p>${resolvedText}</p>`;

    try {
        const { data, error } = await getResendClient().emails.send({
            from: ENV.EMAIL_FROM,
            to,
            subject,
            text: resolvedText,
            html: resolvedHtml,
        });

        if (error || !data?.id) {
            throw new Error(formatEmailError(error));
        }

        console.log(`[Email] Sent to ${to} - id: ${data.id}`);
        return { id: data.id };
    } catch (error) {
        const reason = formatEmailError(error);
        console.error(`[Email] Failed to send to ${to}: ${reason}`);
        throw new Error(`Failed to send email to "${to}": ${reason}`);
    }
};

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
                    `[Email] Attempt ${attempt + 1}/${maxRetries} failed - retrying in ${delay}ms`
                );
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }

    console.error(`[Email] All ${maxRetries} attempts failed`);
    throw lastError;
};
