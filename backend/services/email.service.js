import nodemailer from 'nodemailer';
import { Resend } from 'resend';

function fromAddress() {
  return process.env.EMAIL_FROM || 'QuickBook <no-reply@quickbook.local>';
}

async function sendWithSmtp(message) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    } : undefined
  });
  return transporter.sendMail({ from: fromAddress(), ...message });
}

async function sendWithResend(message) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  return resend.emails.send({ from: fromAddress(), ...message });
}

export async function sendEmail(message) {
  if (process.env.NODE_ENV !== 'production' && process.env.EMAIL_DISABLED === 'true') {
    console.log('[email disabled]', message);
    return;
  }
  if (process.env.EMAIL_PROVIDER === 'resend') return sendWithResend(message);
  return sendWithSmtp(message);
}

export function bookingSummaryHtml(booking, doctor) {
  return `
    <h2>QuickBook appointment confirmed</h2>
    <p><strong>Doctor:</strong> ${doctor.name}</p>
    <p><strong>Date:</strong> ${booking.date}</p>
    <p><strong>Time:</strong> ${booking.time}</p>
    <p><strong>Patient:</strong> ${booking.name}</p>
    <p><strong>Phone:</strong> ${booking.phone}</p>
    <p><strong>Payment:</strong> Pay at clinic</p>
  `;
}
