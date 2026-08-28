import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { createPortfolioProject, deletePortfolioProject, getPortfolioProjects, updatePortfolioProject } from '@/lib/portfolio-store';
import { PortfolioCategory, PortfolioProjectInput } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const categories: PortfolioCategory[] = ['stickers', 'autobelettering', 'car-wrapping', 'kleding', 'reclameborden', 'banners', 'etiketten', 'overig'];

function parseInput(value: unknown): PortfolioProjectInput {
  const input = value as Partial<PortfolioProjectInput>;
  const slug = String(input.slug ?? '').trim().toLowerCase().replace(/^\/+|\/+$/g, '');
  const category = String(input.category ?? '') as PortfolioCategory;
  const images = Array.isArray(input.images) ? input.images.filter((image) => image && typeof image.id === 'string' && typeof image.url === 'string') : [];
  if (!String(input.title ?? '').trim() || !slug || !String(input.description ?? '').trim() || !String(input.date ?? '').trim() || !images.length) {
    throw new Error('Titel, slug, beschrijving, datum en minimaal één foto zijn verplicht.');
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Gebruik voor de slug alleen letters, cijfers en koppeltekens.');
  if (!categories.includes(category)) throw new Error('Kies een geldige categorie.');
  return {
    title: String(input.title).trim(), slug, category, description: String(input.description).trim(), images,
    published: input.published === true, featured: input.featured === true, date: String(input.date).trim(),
    order: Number.isFinite(Number(input.order)) ? Number(input.order) : 0
  };
}

export async function GET() {
  try {
    const isAdmin = await isAdminAuthenticated();
    return NextResponse.json({ projects: await getPortfolioProjects(isAdmin) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Portfolio kon niet worden geladen.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
  try {
    const project = await createPortfolioProject(parseInput(await request.json()));
    return NextResponse.json({ project, projects: await getPortfolioProjects(true) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Project kon niet worden opgeslagen.' }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
  try {
    const { id, ...value } = await request.json();
    if (typeof id !== 'string' || !id) throw new Error('Ongeldig project.');
    const project = await updatePortfolioProject(id, parseInput(value));
    return NextResponse.json({ project, projects: await getPortfolioProjects(true) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Project kon niet worden opgeslagen.' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
  try {
    const { id } = await request.json();
    if (typeof id !== 'string' || !id) throw new Error('Ongeldig project.');
    await deletePortfolioProject(id);
    return NextResponse.json({ projects: await getPortfolioProjects(true) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Project kon niet worden verwijderd.' }, { status: 400 });
  }
}
