import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ ok: true, mode: 'local-filesystem', storageRoot: process.env.APP_STORAGE_DIR || '/app/storage' });
}
