import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN ?? null;
    return NextResponse.json({
      nodeEnv: process.env.NODE_ENV ?? null,
      blobTokenSet: Boolean(token),
      blobTokenPreview: token ? `${token.slice(0, 10)}...${token.slice(-6)}` : null,
      blobStoreId: process.env.BLOB_STORE_ID ?? null
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
