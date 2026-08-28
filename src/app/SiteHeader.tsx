 'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SitePage } from '@/lib/types';

export default function SiteHeader() {
  const pathname = usePathname();
  const [pages, setPages] = useState<SitePage[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeHash, setActiveHash] = useState('');

  useEffect(() => {
    fetch('/api/pages', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => setPages(data.pages ?? []))
      .catch(() => setPages([]));
  }, []);

  useEffect(() => {
    function updateHash() { setActiveHash(window.location.hash); }
    updateHash();
    window.addEventListener('hashchange', updateHash);
    return () => window.removeEventListener('hashchange', updateHash);
  }, []);

  useEffect(() => { setIsMenuOpen(false); }, [pathname]);

  const contactPage = pages.find((page) => page.published && page.showInMenu && (page.slug === 'contact' || page.title.toLowerCase() === 'contact'));
  const contactHref = contactPage ? `/${contactPage.slug}` : '/product-aanvragen';
  const isHomeActive = pathname === '/' && activeHash !== '#prijzen';
  const isProductsActive = pathname === '/' && activeHash === '#prijzen';

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
          <Link className={isProductsActive ? 'nav-item active' : 'nav-item'} href="/#prijzen">Producten / Prijslijst</Link>
          <Link className={pathname.startsWith('/portfolio') ? 'nav-item active' : 'nav-item'} href="/portfolio">Portfolio</Link>
          <Link className={pathname === contactHref ? 'nav-item active' : 'nav-item'} href={contactHref}>Contact</Link>
          {pages.filter((page) => page.published && page.showInMenu && page.slug !== 'contact' && page.title.toLowerCase() !== 'contact').map((page) => (
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