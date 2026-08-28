import Link from 'next/link';
import SiteHeader from '../../SiteHeader';
import PortfolioManager from './PortfolioManager';
import AdminNavigation from '../AdminNavigation';

export default function AdminPortfolioPage() {
  return <main className="container admin-page-shell"><SiteHeader /><div className="admin-layout"><AdminNavigation /><div className="admin-content"><div className="admin-content-header"><div><span className="admin-eyebrow">Beheeromgeving / Portfolio</span><h1>Portfolio beheren</h1><p>Beheer hier de projecten die zichtbaar zijn op de publieke portfolio-pagina.</p></div><Link className="btn btn-primary" href="#portfolio-form">+ Nieuw portfolio-project</Link></div><PortfolioManager /></div></div></main>;
}
