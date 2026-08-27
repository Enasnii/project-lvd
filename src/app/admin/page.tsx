"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { clearAdminAuthCookie } from '@/lib/auth';
import { Product, ProductInput, ProductRequest, ProductRequestStatus } from '@/lib/types';
import PageManager from './PageManager';
import SiteHeader from '../SiteHeader';

const initialForm: ProductInput = {
  name: '',
  description: '',
  price: '',
  imageUrl: ''
};

export default function AdminPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [products, setProducts] = useState<Product[]>([]);
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch('/api/products', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Kon producten niet laden.');
        setProducts(data.products ?? []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Kon producten niet laden.');
      }
    }

    loadProducts();

    async function loadRequests() {
      try {
        const response = await fetch('/api/product-requests', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Kon aanvragen niet laden.');
        setRequests(data.requests ?? []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Kon aanvragen niet laden.');
      }
    }

    loadRequests();
  }, []);

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setMessage('Afbeelding wordt geüpload...');
    setIsUploading(true);

    try {
      const response = await fetch(`/api/avatar/upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        body: file
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Upload mislukt.');
      }

      setForm((current) => ({ ...current, imageUrl: data.url }));
      setMessage('Afbeelding geüpload.');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload mislukt.');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!form.name.trim() || !form.description.trim() || !form.price || !form.imageUrl.trim()) {
      setError('Vul alle velden in.');
      return;
    }

    const price = Number(form.price);
    if (Number.isNaN(price) || price <= 0) {
      setError('Prijs moet een positief getal zijn.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price,
      imageUrl: form.imageUrl.trim()
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
      setMessage(editingId ? 'Product bijgewerkt.' : 'Product toegevoegd.');
      resetForm();
    } catch (submitError) {
      const fallbackMessage = submitError instanceof Error ? submitError.message : 'Opslaan mislukt.';
      // eslint-disable-next-line no-console
      console.warn('API save failed, falling back to localStorage:', fallbackMessage);

      if (typeof window !== 'undefined') {
        try {
          const storedRaw = window.localStorage.getItem('stickerbedrijf-products');
          const stored = storedRaw ? JSON.parse(storedRaw) as Product[] : [];
          if (editingId) {
            const index = stored.findIndex((p) => p.id === editingId);
            if (index !== -1) {
              stored[index] = { ...stored[index], name: payload.name, description: payload.description, price: payload.price, imageUrl: payload.imageUrl };
            }
            window.localStorage.setItem('stickerbedrijf-products', JSON.stringify(stored));
            setProducts(stored);
            setMessage('Product lokaal bijgewerkt.');
          } else {
            const newProduct: Product = {
              id: crypto.randomUUID(),
              name: payload.name,
              description: payload.description,
              price: payload.price,
              imageUrl: payload.imageUrl,
              createdAt: new Date().toISOString()
            };
            const updated = [newProduct, ...stored];
            window.localStorage.setItem('stickerbedrijf-products', JSON.stringify(updated));
            setProducts(updated);
            setMessage('Product lokaal toegevoegd.');
          }
          resetForm();
          return;
        } catch (localErr) {
          setError(fallbackMessage);
          return;
        }
      }

      setError(fallbackMessage);
    }
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setForm({ name: product.name, description: product.description, price: product.price.toString(), imageUrl: product.imageUrl });
  }

  async function handleDelete(id: string) {
    try {
      const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Verwijderen mislukt.');
      setProducts(data.products ?? []);
      setMessage('Product verwijderd.');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Verwijderen mislukt.');
    }
  }

  async function handleDeleteRequest(id: string) {
    try {
      const response = await fetch('/api/product-requests', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Aanvraag verwijderen mislukt.');
      setRequests((current) => current.filter((request) => request.id !== id));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Aanvraag verwijderen mislukt.');
    }
  }

  async function handleRequestStatusChange(id: string, status: ProductRequestStatus) {
    try {
      const response = await fetch('/api/product-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Status opslaan mislukt.');
      setRequests((current) => current.map((request) => request.id === id ? data.request : request));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Status opslaan mislukt.');
    }
  }

  function logout() {
    clearAdminAuthCookie();
    router.push('/admin/login');
  }

  return (
    <main className="container" style={{ paddingBottom: '3rem' }}>
      <SiteHeader />
      <div className="admin-toolbar">
        <span>Beheeromgeving</span>
        <button className="btn btn-secondary" onClick={logout}>Uitloggen</button>
      </div>

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
          <label>Afbeelding uploaden
            <input type="file" accept="image/*" onChange={handleFileUpload} />
          </label>
          <label>Of afbeeldings-URL
            <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
          </label>
          <div className="nav-links">
            <button className="btn btn-primary" type="submit" disabled={isUploading}>{editingId ? 'Opslaan' : 'Toevoegen'}</button>
            {editingId ? <button className="btn btn-secondary" type="button" onClick={resetForm}>Annuleren</button> : null}
          </div>
        </form>
        {error ? <p className="error">{error}</p> : null}
        {message ? <p className="success">{message}</p> : null}
      </section>

      <section className="table-card">
        <h2>Beschikbare producten</h2>
        <table>
          <thead>
            <tr><th>Product</th><th>Prijs</th><th>Afbeelding</th><th>Acties</th></tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <strong>{product.name}</strong>
                  <div>{product.description}</div>
                </td>
                <td>€{product.price.toFixed(2)}</td>
                <td><img src={product.imageUrl} alt={product.name} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 12 }} /></td>
                <td>
                  <div className="nav-links">
                    <button className="btn btn-secondary" onClick={() => startEdit(product)}>Bewerken</button>
                    <button className="btn btn-secondary" onClick={() => handleDelete(product.id)}>Verwijderen</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <PageManager />

      <section className="table-card">
        <h2>Productaanvragen</h2>
        {requests.length === 0 ? <p>Er zijn nog geen aanvragen.</p> : (
          <div className="grid grid-2">
            {requests.map((request) => (
              <article key={request.id} className="card">
                <h3>{request.product}</h3>
                <p><strong>Naam:</strong> {request.name}</p>
                <p><strong>E-mail:</strong> {request.email}</p>
                {request.phone ? <p><strong>Telefoon:</strong> {request.phone}</p> : null}
                <p><strong>Aantal:</strong> {request.quantity}</p>
                {request.date ? <p><strong>Leverdatum:</strong> {request.date}</p> : null}
                {request.message ? <p><strong>Bericht:</strong> {request.message}</p> : null}
                {request.imageUrl ? <p><a href={request.imageUrl} target="_blank" rel="noreferrer">Afbeelding bekijken</a></p> : null}
                <p><small>{new Date(request.createdAt).toLocaleString('nl-NL')}</small></p>
                <label>Status
                  <select
                    value={request.status}
                    onChange={(event) => handleRequestStatusChange(request.id, event.target.value as ProductRequestStatus)}
                  >
                    <option value="new">Nieuw</option>
                    <option value="in_progress">In behandeling</option>
                    <option value="completed">Afgerond</option>
                  </select>
                </label>
                <button className="btn btn-secondary" onClick={() => handleDeleteRequest(request.id)}>Verwijderen</button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
