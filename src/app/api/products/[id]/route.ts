import { NextRequest, NextResponse } from 'next/server';
import { deleteProduct, getProducts, updateProduct } from '@/lib/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  try {
    const input = await request.json();
    const product = await updateProduct(context.params.id, input);
    const products = await getProducts();
    return NextResponse.json({ product, products });
  } catch (error) {
    return NextResponse.json({ error: 'Kon product niet bijwerken.' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: { id: string } }) {
  try {
    await deleteProduct(context.params.id);
    const products = await getProducts();
    return NextResponse.json({ success: true, products });
  } catch (error) {
    return NextResponse.json({ error: 'Kon product niet verwijderen.' }, { status: 500 });
  }
}
