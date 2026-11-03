import nodemailer from 'nodemailer';

export type SmtpConfig = { host: string; port: string | number; encryption: string; username: string; password: string };

export function createTransport({ host, port, encryption, username, password }: SmtpConfig) {
  return nodemailer.createTransport({
    host,
    port: Number(port),
    secure: encryption === 'TLS',
    requireTLS: encryption === 'STARTTLS',
    auth: { user: username, pass: password },
  });
}
