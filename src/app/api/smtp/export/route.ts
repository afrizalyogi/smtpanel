import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/crypto';

export async function GET() {
  const value = (await cookies()).get('smtp_creds')?.value;
  if (!value) {
    return NextResponse.json({ error: 'No active SMTP connection found.' }, { status: 401 });
  }
  try {
    // Safe: only reachable by whoever already holds the HttpOnly session cookie.
    return NextResponse.json({ success: true, data: decrypt(value) });
  } catch (error) {
    console.error('Export Error:', error);
    return NextResponse.json({ error: 'Failed to export credentials.' }, { status: 500 });
  }
}
