'use client';

import { useEffect, useState } from 'react';
import { SitePage, SitePageInput } from '@/lib/types';

const initialForm: SitePageInput = { title: '', slug: '', content: '', published: false, showInMenu: false, menuOrder: 0 };

export default function PageManager() {
  const [pages, setPages] = useState<SitePage[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadPages() {
    const response = await fetch('/api/pages', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Pagina\'s konden niet worden geladen.');
    setPages(data.pages ?? []);
  }

  useEffect(() => { loadPages().catch((loadError) => setError(loadError.message)); }, []);

  function updateForm(field: keyof SitePageInput, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function editPage(page: SitePage) {
    setEditingId(page.id);
    setForm({ title: page.title, slug: page.slug, content: page.content, published: page.published, showInMenu: page.showInMenu, menuOrder: page.menuOrder });
  }

  function reset() { setEditingId(null); setForm(initialForm); }

  async function savePage(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/pages', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...form } : form)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Pagina kon niet worden opgeslagen.');
      setPages(data.pages ?? []);
      setMessage(editingId ? 'Pagina bijgewerkt.' : 'Pagina toegevoegd.');
      reset();
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Opslaan mislukt.'); }
  }

  async function removePage(id: string) {
    if (!window.confirm('Deze pagina verwijderen?')) return;
    const response = await fetch('/api/pages', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    const data = await response.json();
    if (!response.ok) { setError(data.error || 'Verwijderen mislukt.'); return; }
    setPages(data.pages ?? []);
    setMessage('Pagina verwijderd.');
  }

  return (
    <section className="table-card">
      <h2>Eigen pagina's</h2>
      <p>Maak bijvoorbeeld een portfolio-, over-ons- of contactpagina en voeg die toe aan het menu.</p>
      <form onSubmit={savePage} className="form-grid">
        <div className="grid grid-2">
          <label>Titel<input value={form.title} onChange={(event) => updateForm('title', event.target.value)} required /></label>
          <label>URL<input value={form.slug} onChange={(event) => updateForm('slug', event.target.value)} placeholder="portfolio" required /></label>
        </div>
        <label>Inhoud<textarea value={form.content} onChange={(event) => updateForm('content', event.target.value)} rows={7} required placeholder="Schrijf hier de inhoud van de pagina..." /></label>
        <div className="grid grid-2">
          <label>Menuvolgorde<input type="number" value={form.menuOrder} onChange={(event) => updateForm('menuOrder', event.target.value)} /></label>
          <div className="checkboxes">
            <label><input type="checkbox" checked={form.published} onChange={(event) => updateForm('published', event.target.checked)} /> Gepubliceerd</label>
            <label><input type="checkbox" checked={form.showInMenu} onChange={(event) => updateForm('showInMenu', event.target.checked)} /> In hoofdmenu tonen</label>
          </div>
        </div>
        <div className="nav-links"><button className="btn btn-primary" type="submit">{editingId ? 'Pagina opslaan' : 'Pagina toevoegen'}</button>{editingId ? <button className="btn btn-secondary" type="button" onClick={reset}>Annuleren</button> : null}</div>
      </form>
      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="success">{message}</p> : null}
      {pages.length > 0 ? <div className="page-list">{pages.map((page) => <div className="page-list-item" key={page.id}><div><strong>{page.title}</strong><small>/{page.slug} · {page.published ? 'Gepubliceerd' : 'Concept'}</small></div><div className="nav-links"><button className="btn btn-secondary" onClick={() => editPage(page)}>Bewerken</button><button className="btn btn-secondary" onClick={() => removePage(page.id)}>Verwijderen</button></div></div>)}</div> : <p>Nog geen eigen pagina's.</p>}
    </section>
  );
}