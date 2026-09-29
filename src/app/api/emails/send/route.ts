import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { decrypt } from '@/lib/crypto';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const credsCookie = cookieStore.get('smtp_creds');

    if (!credsCookie?.value) {
      return NextResponse.json({ error: 'Not connected to SMTP server. Missing credentials.' }, { status: 401 });
    }

    let smtpConfig;
    try {
      smtpConfig = decrypt(credsCookie.value);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid or expired SMTP credentials.' }, { status: 401 });
    }

    const { host, port, encryption, username, password } = smtpConfig;
    
    // Parse FormData for attachments support
    const formData = await request.formData();
    
    const fromDisplay = formData.get('fromDisplay') as string;
    const to = formData.get('to') as string;
    const cc = formData.get('cc') as string;
    const bcc = formData.get('bcc') as string;
    const replyTo = formData.get('replyTo') as string;
    const priority = formData.get('priority') as string;
    const subject = formData.get('subject') as string;
    const html = formData.get('html') as string;
    const text = formData.get('text') as string;

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json({ error: 'Missing required email fields.' }, { status: 400 });
    }

    // Process attachments
    const attachments: { filename: string; content: Buffer; contentType: string }[] = [];
    const files = formData.getAll('attachments') as File[];
    
    if (files.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 attachments allowed.' }, { status: 400 });
    }

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: `File ${file.name} exceeds 10MB limit.` }, { status: 400 });
      }
      const arrayBuffer = await file.arrayBuffer();
      attachments.push({
        filename: file.name,
        content: Buffer.from(arrayBuffer),
        contentType: file.type,
      });
    }

    const secure = encryption === 'TLS';
    const requireTLS = encryption === 'STARTTLS';

    const transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure,
      requireTLS,
      auth: {
        user: username,
        pass: password,
      },
    });

    const info = await transporter.sendMail({
      from: fromDisplay || username,
      to,
      cc: cc || undefined,
      bcc: bcc || undefined,
      replyTo: replyTo || undefined,
      priority: (priority as "high" | "normal" | "low") || undefined,
      subject,
      text: text || undefined,
      html: html || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      response: info.response,
    });

  } catch (error: any) {
    console.error('Send Email Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email.' },
      { status: 500 }
    );
  }
}
