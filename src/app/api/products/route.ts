import { NextRequest, NextResponse } from 'next/server';
import { createProduct, getProducts } from '@/lib/data';
import { isAdminAuthenticated } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const products = await getProducts();
  return NextResponse.json(
    { products },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
  try {
    const input = await request.json();
    const product = await createProduct(input);
    const products = await getProducts();
    return NextResponse.json(
      { product, products },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('products POST error', error);
    const message = error instanceof Error ? error.message : 'Kon product niet aanmaken.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
