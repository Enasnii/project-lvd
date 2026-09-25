"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Product, ProductColor, ProductImage, ProductStatus, ProductVariant } from '@/lib/types';
import AdminNavigation from './AdminNavigation';
import SiteHeader from '../SiteHeader';
import Link from 'next/link';

const colorOptions = [
  { name: 'Zwart', hex: '#111827' }, { name: 'Wit', hex: '#ffffff' }, { name: 'Rood', hex: '#dc2626' },
  { name: 'Blauw', hex: '#2563eb' }, { name: 'Groen', hex: '#16a34a' }, { name: 'Geel', hex: '#facc15' },
  { name: 'Oranje', hex: '#f97316' }, { name: 'Roze', hex: '#ec4899' }, { name: 'Paars', hex: '#9333ea' },
  { name: 'Grijs', hex: '#6b7280' }, { name: 'Beige', hex: '#d6c2a1' }, { name: 'Bruin', hex: '#92400e' }
] as const;
const sizeOptions = ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'] as const;

type ProductForm = {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  slug: string;
  category: string;
  images: ProductImage[];
  colors: ProductColor[];
  variants: ProductVariant[];
  status: ProductStatus;
};

const initialForm: ProductForm = { name: '', description: '', price: '', imageUrl: '', slug: '', category: '', images: [], colors: [], variants: [], status: 'hidden' };

function formatPrice(price: string | number | null | undefined) {
  const textPrice = String(price ?? '').trim();
  const numericPrice = Number(textPrice);
  return textPrice !== '' && Number.isFinite(numericPrice) ? `€${numericPrice.toFixed(2)}` : textPrice;
}

export default function AdminPageClient() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [products, setProducts] = useState<Product[]>([]);
  const [portfolioCount, setPortfolioCount] = useState(0);
  const [newRequestCount, setNewRequestCount] = useState(0);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState(JSON.stringify(initialForm));
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const isDirty = JSON.stringify(form) !== savedSnapshot;

  useEffect(() => {
    if (!isDirty) return;
    function warnBeforeLeave(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = 'Je hebt wijzigingen gemaakt die nog niet zijn opgeslagen.';
    }
    window.addEventListener('beforeunload', warnBeforeLeave);
    return () => window.removeEventListener('beforeunload', warnBeforeLeave);
  }, [isDirty]);

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch('/api/products?admin=1', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Kon producten niet laden.');
        setProducts(data.products ?? []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Kon producten niet laden.');
      }
    }

    loadProducts();
    fetch('/api/product-requests', { cache: 'no-store' })
      .then(async (response) => response.ok ? response.json() : null)
      .then((data) => setNewRequestCount((data?.requests ?? []).filter((request: { status: string }) => request.status === 'new').length))
      .catch(() => setNewRequestCount(0));
    fetch('/api/portfolio', { cache: 'no-store' })
      .then(async (response) => response.ok ? response.json() : null)
      .then((data) => setPortfolioCount((data?.projects ?? []).length))
      .catch(() => setPortfolioCount(0));

  }, []);

  function resetForm() {
    setForm(initialForm);
    setSavedSnapshot(JSON.stringify(initialForm));
    setEditingId(null);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    setError('');
    setMessage('Afbeeldingen worden geüpload...');
    setIsUploading(true);

    try {
      const uploaded = await Promise.all(files.map(async (file) => {
        const body = new FormData();
        body.append('file', file);
        const response = await fetch('/api/products/upload', { method: 'POST', body });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Upload mislukt.');
        return { id: crypto.randomUUID(), url: data.url, order: 0 } satisfies ProductImage;
      }));
      setForm((current) => ({ ...current, images: [...current.images, ...uploaded].map((image, index) => ({ ...image, order: index })), imageUrl: current.imageUrl || uploaded[0]?.url || '' }));
      setMessage(`${uploaded.length} afbeelding${uploaded.length === 1 ? '' : 'en'} toegevoegd.`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload mislukt.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  }

  function removeImage(id: string) {
    setForm((current) => ({ ...current, images: current.images.filter((image) => image.id !== id).map((image, index) => ({ ...image, order: index })) }));
  }

  function setMainImage(id: string) {
    setForm((current) => {
      const selected = current.images.find((image) => image.id === id);
      if (!selected) return current;
      const images = [selected, ...current.images.filter((image) => image.id !== id)].map((image, index) => ({ ...image, order: index }));
      return { ...current, images, imageUrl: selected.url };
    });
  }

  function moveImage(index: number, direction: -1 | 1) {
    setForm((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.images.length) return current;
      const images = [...current.images];
      [images[index], images[target]] = [images[target], images[index]];
      return { ...current, images: images.map((image, imageIndex) => ({ ...image, order: imageIndex })), imageUrl: images[0]?.url || '' };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!form.name.trim() || !form.description.trim() || !form.price.trim()) {
      setError('Vul alle velden in.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: form.price.trim(),
      imageUrl: form.imageUrl.trim(),
      slug: form.slug.trim(),
      category: form.category.trim(),
      images: form.images,
      colors: form.colors,
      variants: form.variants,
      mainImageUrl: form.images[0]?.url || form.imageUrl.trim(),
      status: form.status
    };

    try {
      const response = editingId
        ? await fetch(`/api/products/${editingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
        : await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Opslaan mislukt.');

      setProducts(data.products ?? []);
      setMessage('✓ Product succesvol opgeslagen');
      resetForm();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Opslaan mislukt.');
    }
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    const nextForm = { name: product.name, description: product.description, price: product.price.toString(), imageUrl: product.imageUrl, slug: product.slug, category: product.category, images: product.images, colors: product.colors, variants: product.variants, status: product.status };
    setForm(nextForm);
    setSavedSnapshot(JSON.stringify(nextForm));
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      const response = await fetch(`/api/products/${pendingDelete.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Verwijderen mislukt.');
      setProducts(data.products ?? []);
      setMessage('Product verwijderd.');
      if (editingId === pendingDelete.id) resetForm();
      setPendingDelete(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Verwijderen mislukt.');
    }
  }

  async function logout() {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } finally {
      router.push('/admin/login');
    }
  }

  function handleNavigationCapture(event: React.MouseEvent<HTMLElement>) {
    if (!isDirty || event.defaultPrevented) return;
    const anchor = (event.target as HTMLElement).closest('a');
    const href = anchor?.getAttribute('href');
    if (!href || anchor?.getAttribute('target') === '_blank' || href.startsWith('#') || href.startsWith('mailto:')) return;
    event.preventDefault();
    setPendingNavigation(href);
  }

  return (
    <main className="container" style={{ paddingBottom: '3rem' }} onClickCapture={handleNavigationCapture}>
      <SiteHeader />
      <div className="admin-layout">
      <AdminNavigation />
      <div className="admin-content">
      <div className="admin-content-header"><div><span className="admin-eyebrow">Beheeromgeving</span><h1>Welkom terug</h1><p>Beheer hier de inhoud en aanvragen van Lakenvelder Design.</p></div><button className="btn btn-secondary" onClick={logout}>Uitloggen</button></div>
      <section className="admin-overview-grid">
        <Link className="admin-overview-card" href="/admin/portfolio"><span className="admin-overview-icon">▧</span><span><strong>Portfolio</strong><small>{portfolioCount} {portfolioCount === 1 ? 'project' : 'projecten'} in beheer</small></span><span className="admin-card-arrow">&rarr;</span></Link>
        <Link className="admin-overview-card" href="/admin/product-aanvragen"><span className="admin-overview-icon">▤</span><span><strong>Productaanvragen</strong><small>{newRequestCount} nieuwe {newRequestCount === 1 ? 'aanvraag' : 'aanvragen'}</small></span><span className="admin-card-arrow">&rarr;</span></Link>
      </section>

      <section className="hero">
        <h1>Producten beheren</h1>
        <p>Voeg nieuwe ontwerpen toe, pas prijzen aan of vervang afbeeldingen.</p>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="grid grid-2">
            <label>Productnaam
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label>Prijs (€)
              <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            </label>
          </div>
          <label>Beschrijving
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={4} />
          </label>
          <div className="grid grid-2">
            <label>Slug (optioneel)
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="lakenvelder-t-shirt" />
            </label>
            <label>Categorie
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option value="">Selecteer categorie</option><option value="stickers">Stickers</option><option value="autobelettering">Autobelettering</option><option value="car-wrapping">Car wrapping</option><option value="kleding">Kleding</option><option value="reclameborden">Reclameborden</option><option value="banners">Banners</option><option value="etiketten">Etiketten</option><option value="tegeltjes">Tegeltjes</option><option value="mokken-bidons-tumblers">Mokken / bidons / tumblers</option><option value="overig">Overig</option></select>
            </label>
          </div>
          <fieldset className="admin-option-group"><legend>Status</legend><div className="admin-status-options">{([['published', 'Gepubliceerd'], ['hidden', 'Verborgen']] as [ProductStatus, string][]).map(([status, label]) => <label className="admin-radio-item" key={status}><input type="radio" name="product-status" checked={form.status === status} onChange={() => setForm({ ...form, status })} />{label}</label>)}</div></fieldset>
          <label>Productfoto's uploaden <span className="field-help">Selecteer meerdere afbeeldingen tegelijk. De eerste foto is de hoofdafbeelding.</span>
            <input type="file" accept="image/*" multiple onChange={handleFileUpload} disabled={isUploading} />
          </label>
          {form.images.length ? <div className="product-admin-images" aria-label="Productfoto's">{form.images.map((image, index) => <div className={index === 0 ? 'product-admin-image active' : 'product-admin-image'} key={image.id}><img src={image.url} alt={`Productfoto ${index + 1}`} /><strong>{index === 0 ? 'Hoofdafbeelding' : `Foto ${index + 1}`}</strong><div className="product-admin-image-actions"><button type="button" className="btn btn-secondary" onClick={() => setMainImage(image.id)} disabled={index === 0}>Hoofdafbeelding</button><button type="button" className="btn btn-secondary" onClick={() => moveImage(index, -1)} disabled={index === 0} aria-label="Foto naar voren">&larr;</button><button type="button" className="btn btn-secondary" onClick={() => moveImage(index, 1)} disabled={index === form.images.length - 1} aria-label="Foto naar achteren">&rarr;</button><button type="button" className="btn btn-secondary" onClick={() => removeImage(image.id)}>Verwijderen</button></div></div>)}</div> : <p className="portfolio-upload-empty">Nog geen foto's toegevoegd.</p>}
          <fieldset className="admin-option-group"><legend>Beschikbare kleuren</legend><div className="admin-checkbox-grid">{colorOptions.map((option) => <label className="admin-checkbox-item" key={option.name}><input type="checkbox" checked={form.colors.some((color) => color.name === option.name)} onChange={(event) => setForm((current) => ({ ...current, colors: event.target.checked ? [...current.colors, { id: `color-${option.name.toLowerCase()}`, name: option.name, hex: option.hex }] : current.colors.filter((color) => color.name !== option.name) }))} /><i style={{ backgroundColor: option.hex }} />{option.name}</label>)}</div></fieldset>
          <fieldset className="admin-option-group"><legend>Beschikbare maten / varianten</legend><div className="admin-checkbox-grid admin-size-grid">{sizeOptions.map((size) => <label className="admin-checkbox-item" key={size}><input type="checkbox" checked={form.variants.some((variant) => variant.name === size)} onChange={(event) => setForm((current) => ({ ...current, variants: event.target.checked ? [...current.variants, { id: `size-${size.toLowerCase()}`, name: size }] : current.variants.filter((variant) => variant.name !== size) }))} />{size}</label>)}</div></fieldset>
          <div className="nav-links">
            <button className="btn btn-primary" type="submit" disabled={isUploading}>{editingId ? 'Opslaan' : 'Toevoegen'}</button>
            {editingId ? <button className="btn btn-secondary" type="button" onClick={resetForm}>Annuleren</button> : null}
            {editingId ? <a className="btn btn-secondary" href={`/producten/${form.slug}?preview=1`} target="_blank" rel="noreferrer">Voorbeeld bekijken</a> : null}
          </div>
        </form>
        {error ? <p className="error">{error}</p> : null}
        {message ? <p className="success">{message}</p> : null}
      </section>

      <section className="table-card">
        <h2>Beschikbare producten</h2>
        <table>
          <thead>
            <tr><th>Product</th><th>Prijs</th><th>Status</th><th>Afbeelding</th><th>Acties</th></tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <strong>{product.name}</strong>
                  <div>{product.description}</div>
                </td>
                <td>{formatPrice(product.price)}</td>
                <td><span className={`product-status product-status-${product.status}`}>{product.status === 'hidden' ? 'Verborgen' : 'Gepubliceerd'}</span></td>
                <td>{product.imageUrl ? <img src={product.imageUrl} alt={product.name} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 12 }} /> : 'Geen afbeelding'}</td>
                <td>
                  <div className="nav-links">
                    <button className="btn btn-secondary" onClick={() => startEdit(product)}>Bewerken</button>
                    <a className="btn btn-secondary" href={`/producten/${product.slug}?preview=1`} target="_blank" rel="noreferrer">Voorbeeld</a>
                    <button className="btn btn-danger" onClick={() => setPendingDelete(product)}>Verwijderen</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {pendingDelete ? <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPendingDelete(null); }}><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="delete-product-title"><h2 id="delete-product-title">Product verwijderen?</h2><p>Weet je zeker dat je <strong>{pendingDelete.name}</strong> wilt verwijderen?</p><p className="admin-modal-warning">Het product en de gekoppelde productafbeeldingen worden verwijderd. Deze actie kan niet ongedaan worden gemaakt.</p><div className="nav-links"><button className="btn btn-secondary" type="button" onClick={() => setPendingDelete(null)}>Annuleren</button><button className="btn btn-danger" type="button" onClick={confirmDelete}>Product verwijderen</button></div></section></div> : null}
      {pendingNavigation ? <div className="admin-modal-backdrop" role="presentation"><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="unsaved-product-title"><h2 id="unsaved-product-title">Wijzigingen niet opgeslagen</h2><p>Je hebt wijzigingen gemaakt die nog niet zijn opgeslagen.</p><div className="nav-links"><button className="btn btn-secondary" type="button" onClick={() => setPendingNavigation(null)}>Annuleren</button><button className="btn btn-danger" type="button" onClick={() => { const destination = pendingNavigation; setPendingNavigation(null); setSavedSnapshot(JSON.stringify(form)); router.push(destination); }}>Pagina verlaten</button></div></section></div> : null}

      </div>
      </div>
    </main>
  );
}
