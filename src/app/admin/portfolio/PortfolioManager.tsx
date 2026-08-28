'use client';

import { useEffect, useState } from 'react';
import { PortfolioCategory, PortfolioImage, PortfolioProject, PortfolioProjectInput } from '@/lib/types';

const categoryLabels: Record<PortfolioCategory, string> = { stickers: 'Stickers', autobelettering: 'Autobelettering', 'car-wrapping': 'Car wrapping', kleding: 'T-shirts & kleding', reclameborden: 'Reclameborden', banners: 'Banners', etiketten: 'Etiketten', tegeltjes: 'Tegeltjes', 'mokken-bidons-tumblers': 'Mokken / Bidons / Tumblers', overig: 'Overig' };
const categories = Object.keys(categoryLabels) as PortfolioCategory[];

function slugify(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function emptyForm(): PortfolioProjectInput {
  return { title: '', slug: '', category: 'overig', description: '', images: [], published: false, featured: false, date: new Date().toISOString().slice(0, 10), order: 0 };
}

export default function PortfolioManager() {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [form, setForm] = useState<PortfolioProjectInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/portfolio', { cache: 'no-store' }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Portfolio kon niet worden geladen.');
      setProjects(data.projects ?? []);
    }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Portfolio kon niet worden geladen.')).finally(() => setIsLoading(false));
  }, []);

  function reset() { setForm(emptyForm()); setEditingId(null); }

  function updateTitle(title: string) {
    setForm((current) => ({ ...current, title, slug: editingId ? current.slug : slugify(title) }));
  }

  async function uploadFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setError(''); setMessage('Foto\'s worden geüpload...'); setIsUploading(true);
    try {
      const uploaded = await Promise.all(files.map(async (file) => {
        const body = new FormData(); body.append('file', file);
        const response = await fetch('/api/portfolio/upload', { method: 'POST', body });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Upload mislukt.');
        return { id: crypto.randomUUID(), url: data.url } as PortfolioImage;
      }));
      setForm((current) => ({ ...current, images: [...current.images, ...uploaded] }));
      setMessage(`${uploaded.length} foto${uploaded.length === 1 ? '' : '\'s'} toegevoegd.`);
    } catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : 'Upload mislukt.'); }
    finally { setIsUploading(false); event.target.value = ''; }
  }

  function removeImage(id: string) { setForm((current) => ({ ...current, images: current.images.filter((image) => image.id !== id) })); }

  function moveImage(index: number) {
    if (draggedIndex === null || draggedIndex === index) return;
    setForm((current) => {
      const images = [...current.images]; const [moved] = images.splice(draggedIndex, 1); images.splice(index, 0, moved); return { ...current, images };
    });
    setDraggedIndex(null);
  }

  function editProject(project: PortfolioProject) {
    setEditingId(project.id);
    setForm({ title: project.title, slug: project.slug, category: project.category, description: project.description, images: project.images, published: project.published, featured: project.featured, date: project.date, order: project.order });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveProject(event: React.FormEvent) {
    event.preventDefault(); setError(''); setMessage('');
    if (!form.images.length) { setError('Voeg minimaal één foto toe.'); return; }
    try {
      const response = await fetch('/api/portfolio', { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingId ? { id: editingId, ...form } : form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Project kon niet worden opgeslagen.');
      setProjects(data.projects ?? []); setMessage(editingId ? 'Project bijgewerkt.' : 'Project toegevoegd.'); reset();
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Opslaan mislukt.'); }
  }

  async function removeProject(id: string) {
    if (!window.confirm('Dit portfolio-project definitief verwijderen?')) return;
    const response = await fetch('/api/portfolio', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    const data = await response.json();
    if (!response.ok) { setError(data.error || 'Verwijderen mislukt.'); return; }
    setProjects(data.projects ?? []); if (editingId === id) reset(); setMessage('Project verwijderd.');
  }

  return <>
    <section className="hero admin-page-intro"><span className="badge">Beheeromgeving</span><h1>Portfolio</h1><p>Beheer projecten, publicatie en projectfoto's vanuit één overzicht.</p></section>
    <section className="table-card portfolio-admin-form"><div className="section-heading"><div><h2>{editingId ? 'Project bewerken' : 'Nieuw project'}</h2><p>De eerste foto wordt automatisch de hoofdafbeelding.</p></div></div>
      <form onSubmit={saveProject} className="form-grid">
        <label>Titel<input value={form.title} onChange={(event) => updateTitle(event.target.value)} required /></label>
        <div className="grid grid-3"><label>Categorie<select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as PortfolioCategory }))}>{categories.filter((category) => category !== 'car-wrapping').map((category) => <option value={category} key={category}>{categoryLabels[category]}</option>)}</select></label><label>Datum<input type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} required /></label><label>Volgorde<input type="number" min="0" value={form.order} onChange={(event) => setForm((current) => ({ ...current, order: Number(event.target.value) }))} /></label></div>
        <label>Beschrijving<textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={6} required /></label>
        <label>Foto's toevoegen<input type="file" accept="image/*" multiple onChange={uploadFiles} disabled={isUploading} /></label>
        {form.images.length ? <div className="portfolio-upload-grid" aria-label="Projectfoto's">{form.images.map((image, index) => <div className="portfolio-upload-item" key={image.id} draggable onDragStart={() => setDraggedIndex(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => moveImage(index)}><img src={image.url} alt={`Preview ${index + 1}`} /><span>{index === 0 ? 'Hoofdafbeelding' : `Foto ${index + 1}`}</span><button type="button" className="btn btn-secondary" onClick={() => removeImage(image.id)}>Verwijderen</button></div>)}</div> : <p className="portfolio-upload-empty">Nog geen foto's toegevoegd.</p>}
        <div className="checkboxes"><label><input type="checkbox" checked={form.published} onChange={(event) => setForm((current) => ({ ...current, published: event.target.checked }))} /> Gepubliceerd</label><label><input type="checkbox" checked={form.featured} onChange={(event) => setForm((current) => ({ ...current, featured: event.target.checked }))} /> Uitgelicht <small className="field-help">Markeer dit project als uitgelicht. Uitgelichte projecten kunnen extra prominent worden weergegeven op de portfolio-pagina.</small></label></div>
        <div className="nav-links"><button className="btn btn-primary" type="submit" disabled={isUploading}>{editingId ? 'Project opslaan' : 'Project toevoegen'}</button>{editingId ? <button className="btn btn-secondary" type="button" onClick={reset}>Annuleren</button> : null}</div>
      </form>
      {error ? <p className="error">{error}</p> : null}{message ? <p className="success">{message}</p> : null}
    </section>
    <section className="table-card"><div className="section-heading"><div><h2>Alle projecten</h2><p>{projects.length} projecten</p></div></div>{isLoading ? <p>Portfolio wordt geladen...</p> : projects.length ? <div className="portfolio-admin-list">{projects.map((project) => <article className="portfolio-admin-item" key={project.id}><img src={project.images[0]?.url} alt="" /><div className="portfolio-admin-item-info"><h3>{project.title}</h3><p>{categoryLabels[project.category]} · {project.published ? 'Gepubliceerd' : 'Concept'}{project.featured ? ' · Uitgelicht' : ''}</p></div><div className="nav-links"><button className="btn btn-secondary" onClick={() => editProject(project)}>Bewerken</button><button className="btn btn-secondary" onClick={() => removeProject(project.id)}>Verwijderen</button></div></article>)}</div> : <p>Er zijn nog geen portfolio-projecten.</p>}</section>
  </>;
}
