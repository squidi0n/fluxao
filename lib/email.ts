import nodemailer from 'nodemailer';

import { logger } from './logger';

// Create reusable transporter
const createTransporter = () => {
  const emailFrom = process.env.EMAIL_FROM || 'noreply@example.com';

  // Use Resend SMTP if available
  if (process.env.RESEND_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY,
      },
    });
  }

  // Fallback to generic SMTP
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS || '',
          }
        : undefined,
    });
  }

  // Development mode - log emails to console
  if (process.env.NODE_ENV === 'development') {
    return nodemailer.createTransporter({
      streamTransport: true,
      newline: 'unix',
    });
  }

  throw new Error('No email configuration found');
};

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    const transporter = createTransporter();
    const from = options.from || process.env.EMAIL_FROM || 'noreply@example.com';

    const info = await transporter.sendMail({
      from,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html?.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    });

    logger.info({ messageId: info.messageId, to: options.to }, 'Email sent successfully');

    // In development, log the email content
    if (process.env.NODE_ENV === 'development' && info.message) {
      logger.debug({ email: info.message.toString() }, 'Email content (development)');
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error({ error, to: options.to }, 'Failed to send email');
    throw error;
  }
}

// Email templates
export const emailTemplates = {
  welcome: (name: string) => ({
    subject: 'Welcome to Our Platform!',
    html: `
      <h1>Welcome, ${name}!</h1>
      <p>Thank you for joining our platform. We're excited to have you on board!</p>
      <p>If you have any questions, feel free to reach out to our support team.</p>
      <p>Best regards,<br>The Team</p>
    `,
  }),

  resetPassword: (name: string, resetLink: string) => ({
    subject: 'Reset Your Password',
    html: `
      <h1>Password Reset Request</h1>
      <p>Hi ${name},</p>
      <p>We received a request to reset your password. Click the link below to create a new password:</p>
      <p><a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br>The Team</p>
    `,
  }),

  verifyEmail: (name: string, verifyLink: string) => ({
    subject: 'Verify Your Email Address',
    html: `
      <h1>Email Verification</h1>
      <p>Hi ${name},</p>
      <p>Please verify your email address by clicking the link below:</p>
      <p><a href="${verifyLink}" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
      <p>This link will expire in 24 hours.</p>
      <p>Best regards,<br>The Team</p>
    `,
  }),

  newsletter: (subject: string, content: string, unsubscribeLink: string) => ({
    subject,
    html: `
      ${content}
      <hr style="margin-top: 40px; border: none; border-top: 1px solid #ddd;">
      <p style="font-size: 12px; color: #666; text-align: center;">
        You received this email because you subscribed to our newsletter.
        <br>
        <a href="${unsubscribeLink}" style="color: #666;">Unsubscribe</a>
      </p>
    `,
  }),

  supportTicket: (ticketId: string, userEmail: string, subject: string, message: string) => ({
    subject: `Support Ticket #${ticketId}: ${subject}`,
    html: `
      <h2>New Support Ticket</h2>
      <p><strong>Ticket ID:</strong> ${ticketId}</p>
      <p><strong>From:</strong> ${userEmail}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <hr>
      <h3>Message:</h3>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `,
  }),
};

// Send verification email
export async function sendVerificationEmail(email: string, name: string, token: string) {
  const verifyLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${token}`;
  const template = emailTemplates.verifyEmail(name, verifyLink);

  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });
}

// Batch email sending for newsletters
export async function sendBatchEmails(
  recipients: string[],
  template: EmailOptions,
  batchSize = 50,
) {
  const results = [];

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);

    try {
      const result = await sendEmail({
        ...template,
        to: batch,
      });
      results.push({ batch, success: true, messageId: result.messageId });
    } catch (error) {
      logger.error({ batch, error }, 'Failed to send batch email');
      results.push({ batch, success: false, error });
    }

    // Add delay between batches to avoid rate limiting
    if (i + batchSize < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}
