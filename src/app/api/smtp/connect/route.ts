import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { encrypt } from '@/lib/crypto';
import { createTransport } from '@/lib/smtp';

export async function POST(request: NextRequest) {
  try {
    const { host, port, encryption, username, password } = await request.json();

    if (!host || !port || !username || !password) {
      return NextResponse.json({ error: 'Missing required SMTP connection parameters.' }, { status: 400 });
    }

    const config = { host, port, encryption, username, password };
    await createTransport(config).verify();

    (await cookies()).set('smtp_creds', encrypt(config), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return NextResponse.json({ success: true, message: 'SMTP connection verified.' });
  } catch (error) {
    console.error('SMTP Connection Error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to connect to SMTP server.' },
      { status: 401 }
    );
  }
}
