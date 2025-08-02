import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT || 587,
  user: process.env.MAIL_USER,
  password: process.env.MAIL_PASSWORD,
  secure: false,
  requireTLS: true,
  ignoreTLS: false,
  defaultEmail: process.env.MAIL_DEFAULT_EMAIL,
  defaultName: process.env.MAIL_DEFAULT_NAME,
}));
