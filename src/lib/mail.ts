import nodemailer from 'nodemailer';

export const SENDER_EMAIL = 'workwithus@balancenutrition.in';

if (!process.env.GMAIL_APP_PASSWORD || !process.env.GMAIL_USER) {
    console.warn('GMAIL_APP_PASSWORD or GMAIL_USER is missing. Please add to .env.local to enable email sending via nodemailer.');
}

// Reusable transporter using Gmail
export const mailer = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER || SENDER_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD || '',
    },
});
