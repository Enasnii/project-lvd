import { NextRequest, NextResponse } from 'next/server';
import { saveUploadedFile } from '@/lib/local-storage';

export const runtime = 'nodejs';

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

    const url = await saveUploadedFile(file);
    return NextResponse.json({ url });
  } catch (error) {
    console.error('upload error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Upload mislukt.' }, { status: 500 });
  }
}
