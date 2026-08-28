import Link from 'next/link';
import SiteHeader from '../../SiteHeader';
import PortfolioManager from './PortfolioManager';

export default function AdminPortfolioPage() {
  return <main className="container admin-page-shell"><SiteHeader /><div className="admin-toolbar"><div><Link href="/admin">&larr; Terug naar dashboard</Link><span className="admin-toolbar-label">Portfolio beheren</span></div></div><PortfolioManager /></main>;
}
