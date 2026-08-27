'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import SiteHeader from '../../SiteHeader';
import { ProductRequest, ProductRequestStatus } from '@/lib/types';

const statusLabels: Record<ProductRequestStatus, string> = {
  new: 'Nieuw',
  in_progress: 'In behandeling',
  completed: 'Afgerond'
};

export default function ProductRequestsPage() {
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/product-requests', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Aanvragen konden niet worden geladen.');
        setRequests(data.requests ?? []);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Aanvragen konden niet worden geladen.'))
      .finally(() => setIsLoading(false));
  }, []);

  async function changeStatus(id: string, status: ProductRequestStatus) {
    setError('');
    const response = await fetch('/api/product-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    });
    const data = await response.json();
    if (!response.ok) { setError(data.error || 'Status opslaan mislukt.'); return; }
    setRequests((current) => current.map((request) => request.id === id ? data.request : request));
  }

  async function removeRequest(id: string) {
    if (!window.confirm('Deze aanvraag definitief verwijderen?')) return;
    const response = await fetch('/api/product-requests', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    const data = await response.json();
    if (!response.ok) { setError(data.error || 'Aanvraag verwijderen mislukt.'); return; }
    setRequests((current) => current.filter((request) => request.id !== id));
  }

  function renderRequest(request: ProductRequest) {
    return (
      <article key={request.id} className="card request-card">
        <div className="request-card-heading">
          <div><h3>{request.product}</h3><small>{new Date(request.createdAt).toLocaleString('nl-NL')}</small></div>
          <span className={`request-status request-status-${request.status}`}>{statusLabels[request.status]}</span>
        </div>
        <p><strong>Naam:</strong> {request.name}</p>
        <p><strong>E-mail:</strong> <a href={`mailto:${request.email}`}>{request.email}</a></p>
        {request.phone ? <p><strong>Telefoon:</strong> {request.phone}</p> : null}
        <p><strong>Aantal:</strong> {request.quantity}</p>
        {request.date ? <p><strong>Leverdatum:</strong> {request.date}</p> : null}
        {request.message ? <p><strong>Bericht:</strong> {request.message}</p> : null}
        {request.imageUrl ? <p><a href={request.imageUrl} target="_blank" rel="noreferrer">Afbeelding bekijken</a></p> : null}
        <div className="request-card-actions">
          <label>Status<select value={request.status} onChange={(event) => changeStatus(request.id, event.target.value as ProductRequestStatus)}>
            <option value="new">Nieuw</option><option value="in_progress">In behandeling</option><option value="completed">Afgerond</option>
          </select></label>
          <button className="btn btn-secondary" onClick={() => removeRequest(request.id)}>Verwijderen</button>
        </div>
      </article>
    );
  }

  const activeRequests = requests.filter((request) => request.status !== 'completed');
  const archivedRequests = requests.filter((request) => request.status === 'completed');

  return (
    <main className="container admin-page-shell">
      <SiteHeader />
      <div className="admin-toolbar"><div><Link href="/admin">← Terug naar dashboard</Link><span className="admin-toolbar-label">Aanvragen</span></div></div>
      <section className="hero admin-page-intro"><span className="badge">Beheeromgeving</span><h1>Productaanvragen</h1><p>Beheer nieuwe aanvragen en bewaar afgeronde aanvragen overzichtelijk in het archief.</p></section>
      {error ? <p className="error">{error}</p> : null}
      {isLoading ? <p>Bezig met laden...</p> : null}
      {!isLoading ? <>
        <section className="table-card request-section"><div className="section-heading"><div><h2>Open aanvragen</h2><p>{activeRequests.length} {activeRequests.length === 1 ? 'aanvraag' : 'aanvragen'}</p></div></div>
          {activeRequests.length ? <div className="grid grid-2">{activeRequests.map(renderRequest)}</div> : <p>Er staan geen open aanvragen.</p>}
        </section>
        <section className="table-card request-section archive-section"><div className="section-heading"><div><h2>Archief</h2><p>{archivedRequests.length} afgeronde {archivedRequests.length === 1 ? 'aanvraag' : 'aanvragen'}</p></div></div>
          {archivedRequests.length ? <div className="grid grid-2">{archivedRequests.map(renderRequest)}</div> : <p>Het archief is nog leeg.</p>}
        </section>
      </> : null}
    </main>
  );
}