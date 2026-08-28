import { NextResponse } from 'next/server';
import { getPortfolioProjectBySlug } from '@/lib/portfolio-store';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const project = await getPortfolioProjectBySlug(params.slug);
  if (!project) return NextResponse.json({ error: 'Project niet gevonden.' }, { status: 404 });
  return NextResponse.json({ project }, { headers: { 'Cache-Control': 'no-store' } });
}
