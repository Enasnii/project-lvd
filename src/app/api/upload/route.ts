import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function sanitizeFileName(name: string) {
  const base = (name || 'upload').replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-');
  return base || 'upload';
}

async function saveFileLocally(file: File) {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(uploadsDir, { recursive: true });

  const safeName = sanitizeFileName(file.name || 'upload');
  const uniqueName = `${Date.now()}-${safeName}`;
  const targetPath = path.join(uploadsDir, uniqueName);
  const bytes = new Uint8Array(await file.arrayBuffer());
  await fs.writeFile(targetPath, Buffer.from(bytes));

  return `/uploads/${uniqueName}`;
}

async function uploadToBlob(file: File) {
  const { put } = await import('@vercel/blob');
  const safeName = sanitizeFileName(file.name || 'upload');

  const blob = await put(safeName, file, {
    access: 'public',
    contentType: file.type
  });

  return blob.url;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Geen bestand ontvangen.' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Bestand is te groot. Maximaal 5MB.' }, { status: 400 });
    }

    if (process.env.NODE_ENV === 'production' && process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const url = await uploadToBlob(file);
        return NextResponse.json({ url });
      } catch (blobError) {
        console.warn('Blob upload failed, falling back to local file storage. If you want public URLs from Vercel Blob, make sure the store is configured for public access:', blobError);
      }
    }

    const localUrl = await saveFileLocally(file);
    return NextResponse.json({ url: localUrl });
  } catch (error) {
    console.error('upload error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Upload mislukt.' }, { status: 500 });
  }
}
