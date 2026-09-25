import { NextRequest, NextResponse } from 'next/server';
import { deleteProduct, getProducts, updateProduct } from '@/lib/data';
import { getProductBySlug } from '@/lib/products-store';
import { isAdminAuthenticated } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, context: { params: { id: string } }) {
  const product = await getProductBySlug(context.params.id, await isAdminAuthenticated());
  return product ? NextResponse.json({ product }, { headers: { 'Cache-Control': 'no-store' } }) : NextResponse.json({ error: 'Product niet gevonden.' }, { status: 404 });
}

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
  try {
    const input = await request.json();
    if (input.status !== undefined && !['published', 'hidden'].includes(input.status)) throw new Error('Ongeldige productstatus.');
    if (!String(input.name ?? '').trim() || !String(input.description ?? '').trim() || !String(input.price ?? '').trim()) throw new Error('Naam, beschrijving en prijs zijn verplicht.');
    const product = await updateProduct(context.params.id, input);
    const products = await getProducts(true);
    return NextResponse.json(
      { product, products },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Kon product niet bijwerken.' }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: { id: string } }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
  try {
    await deleteProduct(context.params.id);
    const products = await getProducts(true);
    return NextResponse.json(
      { success: true, products },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Kon product niet verwijderen.' }, { status: 400 });
  }
}
