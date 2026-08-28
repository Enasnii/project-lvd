import { NextRequest, NextResponse } from 'next/server';
import { deleteProduct, getProducts, updateProduct } from '@/lib/data';
import { isAdminAuthenticated } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
  try {
    const input = await request.json();
    const product = await updateProduct(context.params.id, input);
    const products = await getProducts();
    return NextResponse.json(
      { product, products },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Kon product niet bijwerken.' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: { id: string } }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
  try {
    await deleteProduct(context.params.id);
    const products = await getProducts();
    return NextResponse.json(
      { success: true, products },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Kon product niet verwijderen.' }, { status: 500 });
  }
}
