import { NextRequest, NextResponse } from 'next/server';
import { createProduct, getProducts } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const input = await request.json();
    const product = await createProduct(input);
    const products = await getProducts();
    return NextResponse.json({ product, products });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Debug route error creating product:', error);
    const message = error instanceof Error ? error.message : 'Kon product niet aanmaken.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const products = await getProducts();
  return NextResponse.json({ products });
}
