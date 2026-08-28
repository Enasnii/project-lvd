import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    if (typeof username !== 'string' || typeof password !== 'string' || !(await authenticateAdmin(username, password))) {
      return NextResponse.json({ error: 'Onjuiste inloggegevens.' }, { status: 401 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('admin login error', error);
    return NextResponse.json({ error: 'Inloggen is tijdelijk niet beschikbaar.' }, { status: 500 });
  }
}
