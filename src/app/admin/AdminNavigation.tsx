'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/admin', label: 'Dashboard', description: 'Overzicht en producten', icon: '⌂' },
  { href: '/admin/portfolio', label: 'Portfolio', description: 'Projecten beheren', icon: '▧' },
  { href: '/admin/product-aanvragen', label: 'Productaanvragen', description: 'Binnengekomen aanvragen', icon: '▤' }
];

export default function AdminNavigation() {
  const pathname = usePathname();

  return <aside className="admin-sidebar" aria-label="Admin navigatie">
    <div className="admin-sidebar-brand"><span className="admin-sidebar-kicker">Lakenvelder Design</span><strong>Beheeromgeving</strong><span>Inhoud & aanvragen</span></div>
    <nav className="admin-sidebar-nav">
      {items.map((item) => {
        const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
        return <Link className={isActive ? 'admin-nav-item active' : 'admin-nav-item'} href={item.href} key={item.href}><span className="admin-nav-icon" aria-hidden="true">{item.icon}</span><span><strong>{item.label}</strong><small>{item.description}</small></span></Link>;
      })}
    </nav>
    <Link className="admin-sidebar-back" href="/">&larr; Terug naar website</Link>
  </aside>;
}
