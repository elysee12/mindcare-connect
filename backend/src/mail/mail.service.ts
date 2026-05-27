import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BrevoClient } from '@getbrevo/brevo';

/**
 * MailService — uses Brevo's HTTP Transactional Email API (v5 SDK).
 *
 * Why HTTP instead of SMTP?
 * Render's free tier blocks outbound SMTP (ports 25, 465, 587).
 * Brevo's REST API goes over HTTPS (port 443) which is always open.
 *
 * Required environment variables:
 *   BREVO_API_KEY   — your Brevo API key (v3)
 *   MAIL_FROM       — sender address verified in Brevo (defaults below)
 *   MAIL_FROM_NAME  — sender display name (optional)
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private client: BrevoClient | null = null;
  private fromEmail = 'connectmindcare@gmail.com';
  private fromName = 'MindCare Connect';

  onModuleInit() {
    const apiKey = process.env.BREVO_API_KEY?.trim();

    if (!apiKey) {
      this.logger.error(
        '[MailService] ❌ BREVO_API_KEY is not set. Emails will NOT be sent.',
      );
      return;
    }

    this.client = new BrevoClient({ apiKey });

    this.fromEmail =
      process.env.MAIL_FROM?.trim() || 'connectmindcare@gmail.com';
    this.fromName =
      process.env.MAIL_FROM_NAME?.trim() || 'MindCare Connect';

    this.logger.log(
      `[MailService] ✅ Brevo HTTP API ready. Sending from: ${this.fromName} <${this.fromEmail}>`,
    );
  }

  /**
   * Core send method — all other helpers call this.
   */
  async sendMail(to: string, subject: string, html: string): Promise<void> {
    if (!this.client) {
      this.logger.error(
        '[MailService] Brevo client not initialised (missing BREVO_API_KEY). Skipping email.',
      );
      return;
    }

    try {
      const result = await this.client.transactionalEmails.sendTransacEmail({
        sender: { name: this.fromName, email: this.fromEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      });
      this.logger.log(
        `[MailService] ✅ Email sent to ${to} — messageId: ${(result as any)?.messageId ?? 'n/a'}`,
      );
    } catch (error: any) {
      this.logger.error(
        `[MailService] ❌ Failed to send email to ${to}: ${error?.message ?? error}`,
      );
      throw error;
    }
  }

  // ─── Email templates ────────────────────────────────────────────────────────

  async sendOtp(to: string, otp: string): Promise<void> {
    const subject = 'Your MindCare Connect OTP Code';
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #2EB67D;">MindCare Connect</h2>
        <p>You requested an OTP to reset your password.</p>
        <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px;
                    text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px;
                       color: #2EB67D;">${otp}</span>
        </div>
        <p>This code will expire in <strong>10 minutes</strong>.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;" />
        <p style="font-size: 12px; color: #777;">
          &copy; 2026 MindCare Connect. All rights reserved.
        </p>
      </div>
    `;
    return this.sendMail(to, subject, html);
  }

  async sendWelcomeEmail(
    to: string,
    fullName: string,
    role: string,
    password?: string,
  ): Promise<void> {
    const subject = 'Welcome to MindCare Connect';
    const appUrl = 'mindcare-dashboard://';

    const credentialsBlock = password
      ? `
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px;
                    margin: 25px 0; border-left: 4px solid #2EB67D;">
          <p style="margin: 0; color: #444;"><strong>Your Temporary Credentials:</strong></p>
          <p style="margin: 10px 0 5px 0;"><strong>Email:</strong> ${to}</p>
          <p style="margin: 0;"><strong>Password:</strong>
            <span style="font-family: monospace; background: #eee; padding: 2px 6px;
                         border-radius: 3px; font-size: 16px;">${password}</span>
          </p>
          <p style="margin: 15px 0 0 0; font-size: 13px; color: #888;">
            Please change your password immediately after your first login.
          </p>
        </div>`
      : '';

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;
                  max-width: 600px; margin: 0 auto; border: 1px solid #eee;
                  border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #2EB67D; margin: 0;">MindCare Connect</h2>
          <p style="color: #666; font-size: 14px; margin-top: 5px;">
            Community Mental Health Follow-Up
          </p>
        </div>
        <h3 style="color: #333;">Welcome to the Platform, ${fullName}!</h3>
        <p>You have been successfully added as a <strong>${role}</strong> to MindCare Connect.</p>
        <p>Our mission is to improve community mental health by facilitating coordination
           between Healthcare Professionals, Community Health Workers, and Family Members.</p>
        ${credentialsBlock}
        <div style="text-align: center; margin: 35px 0;">
          <a href="${appUrl}"
             style="background-color: #2EB67D; color: white; padding: 14px 30px;
                    text-decoration: none; border-radius: 8px; font-weight: bold;
                    display: inline-block; font-size: 16px;">
            Launch MindCare Connect
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 11px; color: #aaa; text-align: center; line-height: 1.5;">
          &copy; 2026 MindCare Connect. All rights reserved.<br/>
          Empowering communities through mental health coordination.
        </p>
      </div>
    `;
    return this.sendMail(to, subject, html);
  }

  async sendAppointmentEmail(
    to: string,
    data: {
      patientName: string;
      appointmentTitle: string;
      appointmentTime: string;
      type: 'creation' | 'reminder';
    },
  ): Promise<void> {
    const isReminder = data.type === 'reminder';

    const subject = isReminder
      ? `Reminder: 1 Day Until Appointment — ${data.patientName}`
      : `New Appointment Scheduled — ${data.patientName}`;

    const titleText = isReminder
      ? 'Appointment Reminder'
      : 'New Appointment Scheduled';

    const bodyText = isReminder
      ? `This is a friendly reminder that there is only 1 day (24 hours) remaining
         until the scheduled appointment for <strong>${data.patientName}</strong>.`
      : `A new appointment has been scheduled for <strong>${data.patientName}</strong>.
         Please find the details below.`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', sans-serif; background: #F8FAFC;
               color: #64748B; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: #fff;
                     border-radius: 12px; overflow: hidden;
                     border: 1px solid #E2E8F0; }
        .header { background: #2EB67D; padding: 30px 20px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 24px; font-weight: 700; }
        .content { padding: 40px 30px; line-height: 1.6; }
        .box { background: #F1F5F9; border-radius: 8px; padding: 25px;
               margin: 25px 0; border-left: 4px solid #2EB67D; }
        .row { margin-bottom: 12px; }
        .lbl { font-weight: 600; color: #1E293B; font-size: 13px;
               text-transform: uppercase; letter-spacing: 0.025em; }
        .val { color: #334155; font-size: 16px; }
        .footer { background: #F8FAFC; padding: 20px; text-align: center;
                  border-top: 1px solid #E2E8F0; }
        .footer p { font-size: 13px; color: #94A3B8; margin: 0; }
      </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>MindCare Connect</h1></div>
          <div class="content">
            <h2 style="color:#1E293B;margin-top:0;">${titleText}</h2>
            <p>${bodyText}</p>
            <div class="box">
              <div class="row">
                <div class="lbl">Patient</div>
                <div class="val">${data.patientName}</div>
              </div>
              <div class="row">
                <div class="lbl">Title</div>
                <div class="val">${data.appointmentTitle}</div>
              </div>
              <div class="row">
                <div class="lbl">Time</div>
                <div class="val">${data.appointmentTime}</div>
              </div>
            </div>
            <p>Please ensure all necessary preparations are made for this appointment.</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 MindCare Connect. All rights reserved.</p>
            <p>This is an automated message — please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendMail(to, subject, html);
  }
}
