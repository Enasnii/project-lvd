import { NextRequest, NextResponse } from 'next/server';
import { createProduct, getProducts } from '@/lib/data';
import { isAdminAuthenticated } from '@/lib/auth';
import { ProductStatus } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const wantsAdminProducts = request.nextUrl.searchParams.get('admin') === '1';
  const products = await getProducts(wantsAdminProducts && await isAdminAuthenticated());
  return NextResponse.json(
    { products },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
  try {
    const input = await request.json();
    if (input.status !== undefined && !(['published', 'hidden'] as ProductStatus[]).includes(input.status)) throw new Error('Ongeldige productstatus.');
    if (!String(input.name ?? '').trim() || !String(input.description ?? '').trim() || !String(input.price ?? '').trim()) throw new Error('Naam, beschrijving en prijs zijn verplicht.');
    const product = await createProduct(input);
    const products = await getProducts(true);
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
