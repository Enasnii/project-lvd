import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';

export const runtime = 'nodejs';

function safeName(name: string) {
  return (name || 'portfolio-image').replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-') || 'portfolio-image';
}

async function saveLocally(file: File) {
  const directory = path.join(process.cwd(), 'public', 'uploads', 'portfolio');
  await fs.mkdir(directory, { recursive: true });
  const filename = `${Date.now()}-${crypto.randomUUID()}-${safeName(file.name)}`;
  await fs.writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()));
  return `/uploads/portfolio/${filename}`;
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file || !file.type.startsWith('image/')) return NextResponse.json({ error: 'Kies een geldig afbeeldingsbestand.' }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Bestand is te groot. Maximaal 10MB.' }, { status: 400 });

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import('@vercel/blob');
      const blob = await put(`portfolio/${crypto.randomUUID()}-${safeName(file.name)}`, file, { access: 'public', contentType: file.type });
      return NextResponse.json({ url: blob.url });
    }

    return NextResponse.json({ url: await saveLocally(file) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Upload mislukt.' }, { status: 500 });
  }
}
