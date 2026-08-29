import { NextResponse } from 'next/server';
import { clearAdminAuthCookie } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  await clearAdminAuthCookie(response);
  return response;
}
