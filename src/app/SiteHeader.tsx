 'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SitePage } from '@/lib/types';

export default function SiteHeader() {
  const [pages, setPages] = useState<SitePage[]>([]);

  useEffect(() => {
    fetch('/api/pages', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => setPages(data.pages ?? []))
      .catch(() => setPages([]));
  }, []);

  return (
    <nav className="site-header" aria-label="Hoofdnavigatie">
      <Link href="/" className="brand-mark">
        <span className="brand-mark-symbol">
          <img src="/logo.png" alt="" />
        </span>
        <span><strong>Lakenvelder Design</strong><small>Print & design</small></span>
      </Link>
      <div className="nav-links site-nav-links">
        <div className="site-nav-main">
          <Link href="/#prijzen">Prijslijst</Link>
        {pages.filter((page) => page.published && page.showInMenu).map((page) => (
          <Link key={page.id} href={`/${page.slug}`}>{page.title}</Link>
        ))}
        </div>
        <div className="site-nav-actions">
          <Link href="/admin/login" className="admin-link">Admin</Link>
          <Link href="/product-aanvragen" className="btn btn-primary">Offerte aanvragen</Link>
        </div>
      </div>
    </nav>
  );
}