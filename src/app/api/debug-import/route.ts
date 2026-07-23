import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { put } = await import('@vercel/blob');
    const key = `debug/test-${Date.now()}.json`;
    const content = Buffer.from(JSON.stringify({ ts: new Date().toISOString() }));
    const res = await put(key, content, { access: 'public', contentType: 'application/json' });
    return NextResponse.json({ ok: true, url: (res as any)?.url ?? null });
  } catch (err: any) {
    console.error('debug-import put error', err);
    try {
      await fs.mkdir(path.join(process.cwd(), '.data'), { recursive: true });
      const errPath = path.join(process.cwd(), '.data', 'error.log');
      const msg = err instanceof Error ? `${new Date().toISOString()} - ${err.stack || err.message}` : `${new Date().toISOString()} - ${String(err)}`;
      await fs.appendFile(errPath, msg + '\n', 'utf8');
    } catch (_) {
      // ignore
    }
    return NextResponse.json({ ok: false, error: String(err?.message ?? String(err)), stack: err?.stack ?? null }, { status: 500 });
  }
}
