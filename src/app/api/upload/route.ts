import { NextRequest, NextResponse } from 'next/server';

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

    const { put } = await import('@vercel/blob');
    const blob = await put(file.name, file, {
      access: 'public',
      contentType: file.type
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error('upload error', error);
    return NextResponse.json({ error: 'Upload mislukt.' }, { status: 500 });
  }
}
