import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type Mail from 'nodemailer/lib/mailer';
import { decrypt } from '@/lib/crypto';
import { createTransport, type SmtpConfig } from '@/lib/smtp';

const MAX_FILES = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const credsCookie = (await cookies()).get('smtp_creds');
    if (!credsCookie?.value) {
      return NextResponse.json({ error: 'Not connected to SMTP server. Missing credentials.' }, { status: 401 });
    }

    let smtpConfig: SmtpConfig;
    try {
      smtpConfig = decrypt<SmtpConfig>(credsCookie.value);
    } catch {
      return NextResponse.json({ error: 'Invalid or expired SMTP credentials.' }, { status: 401 });
    }

    const formData = await request.formData();
    const field = (name: string) => (formData.get(name) as string | null) || undefined;

    const to = field('to');
    const subject = field('subject');
    const html = field('html');
    const text = field('text');
    if (!to || !subject || (!html && !text)) {
      return NextResponse.json({ error: 'Missing required email fields.' }, { status: 400 });
    }

    const files = formData.getAll('attachments') as File[];
    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Maximum ${MAX_FILES} attachments allowed.` }, { status: 400 });
    }
    const tooBig = files.find((file) => file.size > MAX_FILE_BYTES);
    if (tooBig) {
      return NextResponse.json({ error: `File ${tooBig.name} exceeds 10MB limit.` }, { status: 400 });
    }
    const attachments = await Promise.all(
      files.map(async (file) => ({ filename: file.name, content: Buffer.from(await file.arrayBuffer()), contentType: file.type }))
    );

    // Message-IDs must be wrapped in angle brackets.
    const rawInReplyTo = field('inReplyTo')?.trim();
    const inReplyTo = rawInReplyTo ? `<${rawInReplyTo.replace(/^<|>$/g, '')}>` : undefined;

    const from = field('fromDisplay') || smtpConfig.username;
    const replyTo = field('replyTo');

    const mail: Mail.Options = {
      from,
      to,
      cc: field('cc'),
      bcc: field('bcc'),
      replyTo,
      inReplyTo,
      references: inReplyTo,
      priority: field('priority') as Mail.Options['priority'],
      subject,
      text,
      html,
      attachments: attachments.length > 0 ? attachments : undefined,
      headers: formData.get('readReceipt') === 'true' ? { 'Disposition-Notification-To': replyTo || from } : undefined,
    };

    const info = await createTransport(smtpConfig).sendMail(mail);
    return NextResponse.json({ success: true, messageId: info.messageId, response: info.response });
  } catch (error) {
    console.error('Send Email Error:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to send email.' }, { status: 500 });
  }
}
