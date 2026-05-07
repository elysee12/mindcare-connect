import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(MailService.name);
  private fromEmail: string = 'noreply@mindcareconnect.com';

  async onModuleInit() {
    // Gmail SMTP credentials from .env
    let host = process.env.EMAIL_HOST || 'smtp.gmail.com';
    let port = parseInt(process.env.EMAIL_PORT || '587', 10);
    let user = process.env.SMTP_USER; // Matches .env key
    let pass = process.env.SMTP_PASS; // Matches .env key
    
    this.logger.log(`[MailService] Initializing with EMAIL_HOST=${host}, EMAIL_PORT=${port}`);
    this.logger.log(`[MailService] SMTP_USER=${user ? '***configured***' : 'NOT SET'}`);
    this.logger.log(`[MailService] SMTP_PASS=${pass ? '***configured***' : 'NOT SET'}`);
    
    this.fromEmail = process.env.MAIL_FROM || user || 'noreply@mindcareconnect.com';

    // Do NOT automatically generate test credentials if SMTP_USER is provided
    if (!user || !pass) {
      this.logger.warn('[MailService] SMTP_USER or SMTP_PASS not found. Email will fall back to test mode.');
      try {
        const testAccount = await nodemailer.createTestAccount();
        user = testAccount.user;
        pass = testAccount.pass;
        host = testAccount.smtp.host;
        port = testAccount.smtp.port;
        this.fromEmail = `noreply@mindcareconnect.com`;
        this.logger.log(`[MailService] Test account generated. Preview emails at https://ethereal.email`);
      } catch (error: any) {
        this.logger.error('[MailService] Failed to create test account', error?.message);
        return;
      }
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
      // Force IPv4 to avoid ENETUNREACH errors on cloud platforms like Render
      // which often have issues with IPv6 SMTP routing.
      ...(host.includes('gmail.com') || host.includes('googlemail.com') ? { family: 4 } : {}),
    } as any);

    // Verify connection configuration
    try {
      await this.transporter.verify();
      this.logger.log(`[MailService] ✅ Mail transporter verified successfully (${host}:${port})`);
    } catch (error: any) {
      this.logger.error(`[MailService] ❌ Mail transporter verification failed: ${error?.message || 'Unknown error'}`);
      this.logger.warn('[MailService] Attempting fallback to Ethereal test mode...');
      
      // Fallback to Ethereal if provided credentials fail
      try {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: testAccount.smtp.host,
          port: testAccount.smtp.port,
          secure: testAccount.smtp.secure,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        this.fromEmail = 'noreply@mindcareconnect.com';
        this.logger.log('[MailService] ✅ Fallback Ethereal transporter created. Check emails at https://ethereal.email');
      } catch (fallbackError: any) {
        this.logger.error('[MailService] ❌ Failed to create fallback Ethereal transporter', fallbackError?.message);
      }
    }
  }

  async sendMail(to: string, subject: string, html: string) {
    if (!this.transporter) {
      this.logger.error('[MailService] Mail transporter not initialized. Cannot send email.');
      throw new Error('Mail transporter not initialized');
    }

    try {
      this.logger.log(`[MailService] Sending email to ${to} with subject: "${subject}"`);
      const info = await this.transporter.sendMail({
        from: `"MindCare Connect" <${this.fromEmail}>`,
        to,
        subject,
        html,
      });

      this.logger.log(`[MailService] ✅ Email sent successfully to ${to} (MessageID: ${info.messageId})`);
      
      // If using Ethereal, log the preview URL
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        this.logger.log(`[MailService] 📧 Test email preview: ${previewUrl}`);
      }
      
      return info;
    } catch (error: any) {
      this.logger.error(`[MailService] ❌ Failed to send email to ${to}`, error?.message);
      this.logger.error(`[MailService] Error stack:`, error?.stack);
      throw error;
    }
  }

  async sendOtp(to: string, otp: string) {
    const subject = 'Your MindCare Connect OTP Code';
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #4A90E2;">MindCare Connect</h2>
        <p>You requested an OTP to reset your password.</p>
        <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4A90E2;">${otp}</span>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;" />
        <p style="font-size: 12px; color: #777;">&copy; 2026 MindCare Connect. All rights reserved.</p>
      </div>
    `;
    return this.sendMail(to, subject, html);
  }

  async sendWelcomeEmail(to: string, fullName: string, role: string, password?: string) {
    const subject = 'Welcome to MindCare Connect';
    // Use the deep link scheme defined in app.json
    const appUrl = 'mindcare-dashboard://'; 
    
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #2EB67D; margin: 0;">MindCare Connect</h2>
          <p style="color: #666; font-size: 14px; margin-top: 5px;">Community Mental Health Follow-Up</p>
        </div>

        <h3 style="color: #333;">Welcome to the Platform, ${fullName}!</h3>
        <p>You have been successfully added as a <strong>${role}</strong> to MindCare Connect.</p>
        
        <p>Our mission is to improve community mental health by facilitating coordination between Healthcare Professionals, Community Health Workers, and Family Members.</p>
        
        ${password ? `
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2EB67D;">
          <p style="margin: 0; color: #444;"><strong>Your Temporary Credentials:</strong></p>
          <p style="margin: 10px 0 5px 0;"><strong>Email:</strong> ${to}</p>
          <p style="margin: 0;"><strong>Password:</strong> <span style="font-family: monospace; background: #eee; padding: 2px 6px; border-radius: 3px; font-size: 16px;">${password}</span></p>
          <p style="margin: 15px 0 0 0; font-size: 13px; color: #888;">Note: Please change your password immediately after your first login for security.</p>
        </div>
        ` : ''}

        <div style="text-align: center; margin: 35px 0;">
          <a href="${appUrl}" style="background-color: #2EB67D; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px rgba(46, 182, 125, 0.2);">Launch MindCare Connect</a>
        </div>
        
        <p style="font-size: 13px; color: #999; text-align: center;">If the button above doesn't work, you can open the app using this link: <br/> 
          <a href="${appUrl}" style="color: #2EB67D;">${appUrl}</a>
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 11px; color: #aaa; text-align: center; line-height: 1.5;">
          &copy; 2026 MindCare Connect. All rights reserved.<br/>
          Empowering communities through mental health coordination.
        </p>
      </div>
    `;
    return this.sendMail(to, subject, html);
  }
}
