import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { createPage, deletePage, getPages, updatePage } from '@/lib/pages-store';
import { SitePageInput } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseInput(value: unknown): SitePageInput {
  const input = value as Partial<SitePageInput>;
  const slug = String(input.slug ?? '').trim().toLowerCase().replace(/^\/+|\/+$/g, '');
  if (!String(input.title ?? '').trim() || !slug || !String(input.content ?? '').trim()) {
    throw new Error('Titel, URL en inhoud zijn verplicht.');
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Gebruik voor de URL alleen letters, cijfers en koppeltekens.');
  return {
    title: String(input.title).trim(),
    slug,
    content: String(input.content).trim(),
    published: input.published === true,
    showInMenu: input.showInMenu === true,
    menuOrder: Number.isFinite(Number(input.menuOrder)) ? Number(input.menuOrder) : 0
  };
}

export async function GET() {
  try {
    return NextResponse.json({ pages: await getPages(await isAdminAuthenticated()) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Pagina\'s konden niet worden geladen.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
  try {
    const page = await createPage(parseInput(await request.json()));
    return NextResponse.json({ page, pages: await getPages(true) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Pagina kon niet worden opgeslagen.' }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
  try {
    const { id, ...value } = await request.json();
    if (typeof id !== 'string' || !id) throw new Error('Ongeldige pagina.');
    const page = await updatePage(id, parseInput(value));
    return NextResponse.json({ page, pages: await getPages(true) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Pagina kon niet worden opgeslagen.' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
  try {
    const { id } = await request.json();
    if (typeof id !== 'string' || !id) throw new Error('Ongeldige pagina.');
    await deletePage(id);
    return NextResponse.json({ pages: await getPages(true) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Pagina kon niet worden verwijderd.' }, { status: 400 });
  }
}