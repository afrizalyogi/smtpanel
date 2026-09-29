import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/crypto';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const credsCookie = cookieStore.get('smtp_creds');
    
    if (!credsCookie?.value) {
      return NextResponse.json({ error: 'No active SMTP connection found.' }, { status: 401 });
    }

    const data = decrypt(credsCookie.value);
    
    // We successfully decrypted the cookie, return the credentials
    // Note: This is safe because this endpoint is only accessible if the user 
    // already has the secure HttpOnly cookie (meaning they own the session).
    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error('Export Error:', error);
    return NextResponse.json(
      { error: 'Failed to export credentials.' },
      { status: 500 }
    );
  }
}
