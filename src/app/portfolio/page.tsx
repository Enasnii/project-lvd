import type { Metadata } from 'next';
import SiteHeader from '../SiteHeader';
import { getPortfolioProjects } from '@/lib/portfolio-store';
import PortfolioGallery from './PortfolioGallery';

export const metadata: Metadata = {
  title: 'Portfolio - Lakenvelder Design',
  description: 'Bekijk gerealiseerde projecten van Lakenvelder Design: van autobelettering en stickers tot kleding en reclame.'
};

export const dynamic = 'force-dynamic';

export default async function PortfolioPage() {
  const projects = await getPortfolioProjects();
  return <main className="container page-shell portfolio-page"><SiteHeader /><section className="portfolio-intro"><span className="badge">Lakenvelder Design</span><h1>Portfolio</h1><p>Een selectie van projecten die we met aandacht voor detail en een sterke visuele uitstraling hebben gerealiseerd.</p></section>{projects.length ? <PortfolioGallery projects={projects} /> : <div className="portfolio-empty"><h2>Binnenkort meer projecten</h2><p>We werken aan een mooie selectie gerealiseerde projecten. Kom snel terug om ons werk te ontdekken.</p></div>}</main>;
}
