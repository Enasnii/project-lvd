import { NextResponse } from 'next/server';

export async function GET() {
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
