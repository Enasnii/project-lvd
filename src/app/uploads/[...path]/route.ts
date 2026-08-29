import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const relativePath = (params?.path ?? []).join('/');
    if (!relativePath) {
      return NextResponse.json({ error: 'Bestand niet gevonden.' }, { status: 404 });
    }

    const storageBase = process.env.APP_STORAGE_DIR || '/app/storage';
    const filePath = path.join(storageBase, 'uploads', relativePath);
    const file = await fs.readFile(filePath);
    const mimeType = filePath.endsWith('.png') ? 'image/png'
      : filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') ? 'image/jpeg'
      : filePath.endsWith('.webp') ? 'image/webp'
      : filePath.endsWith('.gif') ? 'image/gif'
      : filePath.endsWith('.svg') ? 'image/svg+xml'
      : 'application/octet-stream';

    return new NextResponse(file, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch {
    return NextResponse.json({ error: 'Bestand niet gevonden.' }, { status: 404 });
  }
}
