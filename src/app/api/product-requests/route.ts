import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { deleteProductRequest, getProductRequests } from '@/lib/product-requests-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
  }

  try {
    const requests = await getProductRequests();
    return NextResponse.json({ requests }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('product requests GET error', error);
    return NextResponse.json({ error: 'Aanvragen konden niet worden geladen.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    if (typeof id !== 'string' || !id) {
      return NextResponse.json({ error: 'Ongeldige aanvraag.' }, { status: 400 });
    }

    await deleteProductRequest(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('product request DELETE error', error);
    return NextResponse.json({ error: 'Aanvraag kon niet worden verwijderd.' }, { status: 500 });
  }
}
