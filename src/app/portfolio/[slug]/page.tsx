import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteHeader from '../../SiteHeader';
import { getPortfolioProjectBySlug } from '@/lib/portfolio-store';
import { PortfolioCategory } from '@/lib/types';

const categoryLabels: Record<PortfolioCategory, string> = { stickers: 'Stickers', autobelettering: 'Autobelettering', 'car-wrapping': 'Car wrapping', kleding: 'T-shirts & kleding', reclameborden: 'Reclameborden', banners: 'Banners', etiketten: 'Etiketten', overig: 'Overig' };

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await getPortfolioProjectBySlug(params.slug);
  return project ? { title: `${project.title} - Portfolio | Lakenvelder Design`, description: project.description.slice(0, 160) } : {};
}

export const dynamic = 'force-dynamic';

export default async function PortfolioProjectPage({ params }: Props) {
  const project = await getPortfolioProjectBySlug(params.slug);
  if (!project) notFound();
  const [heroImage, ...galleryImages] = project.images;
  return <main className="container page-shell portfolio-detail-page"><SiteHeader /><Link className="back-link" href="/portfolio">&larr; Terug naar portfolio</Link><article className="portfolio-detail"><div className="portfolio-detail-hero"><img src={heroImage.url} alt={project.title} /></div><div className="portfolio-detail-heading"><div><span className="portfolio-category">{categoryLabels[project.category]}</span><h1>{project.title}</h1></div><time dateTime={project.date}>{new Date(project.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}</time></div><p className="portfolio-detail-description">{project.description}</p>{galleryImages.length ? <div className="portfolio-photo-grid">{galleryImages.map((image, index) => <div className={index === 0 ? 'portfolio-photo portfolio-photo-wide' : 'portfolio-photo'} key={image.id}><img src={image.url} alt={`${project.title} - foto ${index + 2}`} /></div>)}</div> : null}</article></main>;
}
