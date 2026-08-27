import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SiteHeader from '../SiteHeader';
import { getPageBySlug } from '@/lib/pages-store';

type PageProps = { params: { slug: string } };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const page = await getPageBySlug(params.slug);
  return page ? { title: `${page.title} - Lakenvelder Design`, description: page.content.slice(0, 160) } : {};
}

export default async function CustomPage({ params }: PageProps) {
  const page = await getPageBySlug(params.slug);
  if (!page) notFound();

  return (
    <main className="container">
      <SiteHeader />
      <article className="hero custom-page">
        <span className="badge">Lakenvelder Design</span>
        <h1>{page.title}</h1>
        <div className="page-content">{page.content}</div>
      </article>
    </main>
  );
}