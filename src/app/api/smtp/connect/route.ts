import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { encrypt } from '@/lib/crypto';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { host, port, encryption, username, password } = body;

    if (!host || !port || !username || !password) {
      return NextResponse.json({ error: 'Missing required SMTP connection parameters.' }, { status: 400 });
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

    // Verify connection
    await transporter.verify();

    // Connection successful, encrypt credentials
    const payload = { host, port, encryption, username, password };
    const encryptedCredentials = encrypt(payload);

    // Set secure HttpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set('smtp_creds', encryptedCredentials, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return NextResponse.json({ success: true, message: 'SMTP connection verified.' });

  } catch (error: any) {
    console.error('SMTP Connection Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to connect to SMTP server.' },
      { status: 401 }
    );
  }
}
