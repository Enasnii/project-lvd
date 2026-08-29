import { NextResponse } from 'next/server';
import { saveUploadedFile } from '@/lib/local-storage';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename') || 'upload';
    const file = new File([await request.arrayBuffer()], filename, { type: 'application/octet-stream' });

    const url = await saveUploadedFile(file);
    return NextResponse.json({ url });
  } catch (error) {
    console.error('avatar upload error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed.' },
      { status: 500 }
    );
  }
}
