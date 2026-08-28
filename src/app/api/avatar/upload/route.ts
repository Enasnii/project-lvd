import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename') || 'upload';

    if (!request.body) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    const blob = await put(filename, request.body, {
      access: 'public'
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error('avatar upload error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed.' },
      { status: 500 }
    );
  }
}
