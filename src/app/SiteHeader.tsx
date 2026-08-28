 'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SitePage } from '@/lib/types';

export default function SiteHeader() {
  const pathname = usePathname();
  const [pages, setPages] = useState<SitePage[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/pages', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => setPages(data.pages ?? []))
      .catch(() => setPages([]));
  }, []);

  useEffect(() => { setIsMenuOpen(false); }, [pathname]);

  const isHomeActive = pathname === '/';

  return (
    <header className="site-header">
      <nav className="site-header-inner" aria-label="Hoofdnavigatie">
      <Link href="/" className="brand-mark" aria-label="Lakenvelder Design - Home">
        <span className="brand-mark-symbol">
          <img src="/logo.png" alt="" />
        </span>
        <span><strong>Lakenvelder Design</strong><small>Print & design</small></span>
      </Link>
      <button className="mobile-menu-button" type="button" aria-expanded={isMenuOpen} aria-controls="site-navigation" onClick={() => setIsMenuOpen((current) => !current)}>
        <span className="mobile-menu-icon" aria-hidden="true"><span /><span /><span /></span>
        <span className="sr-only">Menu {isMenuOpen ? 'sluiten' : 'openen'}</span>
      </button>
      <div id="site-navigation" className={isMenuOpen ? 'site-nav-links is-open' : 'site-nav-links'}>
        <div className="site-nav-main">
          <Link className={isHomeActive ? 'nav-item active' : 'nav-item'} href="/">Home</Link>
          <Link className={pathname.startsWith('/portfolio') ? 'nav-item active' : 'nav-item'} href="/portfolio">Portfolio</Link>
          {pages.filter((page) => page.published && page.showInMenu).map((page) => (
            <Link className={pathname === `/${page.slug}` ? 'nav-item active' : 'nav-item'} key={page.id} href={`/${page.slug}`}>{page.title}</Link>
          ))}
        </div>
        <div className="site-nav-actions">
          <Link href="/admin/login" className="admin-link">Admin</Link>
          <Link href="/product-aanvragen" className="btn btn-primary quote-cta">Offerte aanvragen <span aria-hidden="true">&rarr;</span></Link>
        </div>
      </div>
      </nav>
    </header>
  );
}