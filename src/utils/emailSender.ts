import nodemailer from 'nodemailer';

// Nodemailer transport configured with Gmail credentials from environment variables.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Sends an email with the given recipient, subject, and plain-text body.
export const sendEmail = async (to: string, subject: string, text: string) => {
    const mailOptions = {
        from: `"${process.env.EMAIL_USER}" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
    };
    await transporter.sendMail(mailOptions);
};
