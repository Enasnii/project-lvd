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
    <nav>
      <Link href="/"><strong>Lakenvelder Design</strong></Link>
      <div className="nav-links">
        <Link href="/#prijzen">Prijslijst</Link>
        {pages.filter((page) => page.published && page.showInMenu).map((page) => (
          <Link key={page.id} href={`/${page.slug}`}>{page.title}</Link>
        ))}
        <Link href="/product-aanvragen" className="btn btn-secondary">Product aanvragen</Link>
      </div>
    </nav>
  );
}