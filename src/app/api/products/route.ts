import { NextRequest, NextResponse } from 'next/server';
import { createProduct, getProducts } from '@/lib/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const products = await getProducts();
  return NextResponse.json({ products });
}

export async function POST(request: NextRequest) {
  try {
    const input = await request.json();
    const product = await createProduct(input);
    const products = await getProducts();
    return NextResponse.json({ product, products });
  } catch (error) {
    return NextResponse.json({ error: 'Kon product niet aanmaken.' }, { status: 500 });
  }
}
