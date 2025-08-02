import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

interface MailOptions {
  to: string;
  subject: string;
  templateName: string;
  context: Record<string, any>;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly mailer;

  constructor(private configService: ConfigService) {
    this.mailer = nodemailer.createTransport({
      host: this.configService.get<string>('mail.host'),
      port: this.configService.get<number>('mail.port'),
      auth: {
        user: this.configService.get<string>('mail.user'),
        pass: this.configService.get<string>('mail.password'),
      },
      ignoreTLS: this.configService.get<boolean>('mail.ignoreTLS'),
      secure: this.configService.get<boolean>('mail.secure'),
      requireTLS: this.configService.get<boolean>('mail.requireTLS'),
    });
  }

  private compileTemplate(templateName: string, context: any): string {
    try {
      const templatePath = path.join(
        __dirname,
        'templates',
        `${templateName}.hbs`,
      );
      const template = fs.readFileSync(templatePath, 'utf8');
      const compiledTemplate = handlebars.compile(template);
      return compiledTemplate({
        ...context,
        year: new Date().getFullYear(),
      });
    } catch (error) {
      this.logger.error(
        `Failed to compile template ${templateName}: ${error.message}`,
      );
      throw new Error(`Template compilation failed`);
    }
  }

  private async sendMail(options: MailOptions): Promise<void> {
    try {
      const html = this.compileTemplate(options.templateName, options.context);

      await this.mailer.sendMail({
        from: `${this.configService.get<string>('mail.defaultName')} <${this.configService.get<string>('mail.defaultEmail')}>`,
        to: options.to,
        subject: options.subject,
        html,
      });

      this.logger.log(
        `Email sent to ${options.to} with subject "${options.subject}"`,
      );
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      throw new Error('Failed to send email');
    }
  }

  async sendAccountVerificationOtp(email: string, otp: string): Promise<void> {
    await this.sendMail({
      to: email,
      subject: 'Verify Account OTP',
      templateName: 'account-verify',
      context: { email, otp },
    });
  }

  async sendPasswordResetOtp(email: string, otp: string): Promise<void> {
    await this.sendMail({
      to: email,
      subject: 'Password Reset OTP',
      templateName: 'password-reset-otp',
      context: { email, otp },
    });
  }

  async sendPasswordResetLink(email: string, resetLink: string): Promise<void> {
    await this.sendMail({
      to: email,
      subject: 'Reset Your Password',
      templateName: 'password-reset-link',
      context: { email, resetLink },
    });
  }

  async sendPasswordResetConfirmation(email: string): Promise<void> {
    await this.sendMail({
      to: email,
      subject: 'Password Reset Successful',
      templateName: 'password-reset-success',
      context: { email },
    });
  }
}
