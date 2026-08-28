'use client';

import Link from 'next/link';
import { useState } from 'react';
import { PortfolioCategory, PortfolioProject } from '@/lib/types';

type PortfolioFilter = 'alles' | 'stickers' | 'auto' | 'kleding' | 'reclame' | 'overig';
const filters: { value: PortfolioFilter; label: string }[] = [
  { value: 'alles', label: 'Alles' }, { value: 'stickers', label: 'Stickers' }, { value: 'auto', label: 'Auto' },
  { value: 'kleding', label: 'Kleding' }, { value: 'reclame', label: 'Reclame' }, { value: 'overig', label: 'Overig' }
];
const categoryLabels: Record<PortfolioCategory, string> = { stickers: 'Stickers', autobelettering: 'Autobelettering', 'car-wrapping': 'Car wrapping', kleding: 'T-shirts & kleding', reclameborden: 'Reclameborden', banners: 'Banners', etiketten: 'Etiketten', overig: 'Overig' };
const filterCategories: Record<Exclude<PortfolioFilter, 'alles'>, PortfolioCategory[]> = { stickers: ['stickers'], auto: ['autobelettering', 'car-wrapping'], kleding: ['kleding'], reclame: ['reclameborden', 'banners', 'etiketten'], overig: ['overig'] };

export default function PortfolioGallery({ projects }: { projects: PortfolioProject[] }) {
  const [filter, setFilter] = useState<PortfolioFilter>('alles');
  const visibleProjects = filter === 'alles' ? projects : projects.filter((project) => filterCategories[filter].includes(project.category));

  return (
    <>
      <div className="portfolio-filters" role="tablist" aria-label="Portfolio categorieën">
        {filters.map((item) => <button key={item.value} className={filter === item.value ? 'portfolio-filter active' : 'portfolio-filter'} onClick={() => setFilter(item.value)} aria-pressed={filter === item.value}>{item.label}</button>)}
      </div>
      {visibleProjects.length ? <div className="portfolio-grid">
        {visibleProjects.map((project) => <Link className="portfolio-card" href={`/portfolio/${project.slug}`} key={project.id}>
          <div className="portfolio-card-image"><img src={project.images[0]?.url} alt={project.title} /></div>
          <div className="portfolio-card-content"><span className="portfolio-category">{categoryLabels[project.category]}</span><h2>{project.title}</h2><p>{project.description}</p><span className="portfolio-card-link">Bekijk project <span aria-hidden="true">&rarr;</span></span></div>
        </Link>)}
      </div> : <div className="portfolio-empty"><h2>Geen projecten in deze categorie</h2><p>Bekijk een andere categorie of ontdek binnenkort nieuwe projecten.</p></div>}
    </>
  );
}
