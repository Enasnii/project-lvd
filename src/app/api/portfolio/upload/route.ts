import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { saveUploadedFile } from '@/lib/local-storage';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file || !file.type.startsWith('image/')) return NextResponse.json({ error: 'Kies een geldig afbeeldingsbestand.' }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Bestand is te groot. Maximaal 10MB.' }, { status: 400 });

    return NextResponse.json({ url: await saveUploadedFile(file, 'portfolio') });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Upload mislukt.' }, { status: 500 });
  }
}
