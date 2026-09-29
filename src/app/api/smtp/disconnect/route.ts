import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete('smtp_creds');
  
  return NextResponse.json({ success: true });
}
