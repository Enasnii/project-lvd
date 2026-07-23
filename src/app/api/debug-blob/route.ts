import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function GET() {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ ok: false, error: 'BLOB_READ_WRITE_TOKEN not set' }, { status: 400 });
    }

    const { put } = await import('@vercel/blob');

    const key = `debug/test-${Date.now()}.json`;
    const content = Buffer.from(JSON.stringify({ ts: new Date().toISOString() }));
    const res = await put(key, content, { access: 'public', contentType: 'application/json' });

    return NextResponse.json({ ok: true, url: (res as any)?.url ?? null });
  } catch (err: any) {
    console.error('debug-blob error', err);
    try {
      await fs.mkdir(path.join(process.cwd(), '.data'), { recursive: true });
      const errPath = path.join(process.cwd(), '.data', 'error.log');
      const msg = err instanceof Error ? `${new Date().toISOString()} - ${err.stack || err.message}` : `${new Date().toISOString()} - ${String(err)}`;
      await fs.appendFile(errPath, msg + '\n', 'utf8');
    } catch (_) {
      // ignore
    }
    try {
      return NextResponse.json({ ok: false, error: String(err?.message ?? String(err)) }, { status: 500 });
    } catch (_) {
      return new NextResponse('error', { status: 500 });
    }
  }
}
