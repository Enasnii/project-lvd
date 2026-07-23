"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { clearAdminAuthCookie } from '@/lib/auth';
import { Product, ProductInput } from '@/lib/types';

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
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch('/api/products');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Kon producten niet laden.');
        setProducts(data.products ?? []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Kon producten niet laden.');
      }
    }

    loadProducts();
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
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
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

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price,
        imageUrl: form.imageUrl.trim()
      };

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
      setError(submitError instanceof Error ? submitError.message : 'Opslaan mislukt.');
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

  function logout() {
    clearAdminAuthCookie();
    router.push('/admin/login');
  }

  return (
    <main className="container" style={{ paddingBottom: '3rem' }}>
      <nav>
        <div><strong>Stickerbedrijf Admin</strong></div>
        <div className="nav-links">
          <Link href="/">Publieke pagina</Link>
          <button className="btn btn-secondary" onClick={logout}>Uitloggen</button>
        </div>
      </nav>

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
    </main>
  );
}
