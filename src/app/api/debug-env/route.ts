import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      nodeEnv: process.env.NODE_ENV ?? null,
      appStorageDir: process.env.APP_STORAGE_DIR ?? '/app/storage',
      postgresUrlSet: Boolean(process.env.POSTGRES_URL),
      adminUsernameSet: Boolean(process.env.ADMIN_USERNAME)
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
