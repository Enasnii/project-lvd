"use client";

import { useEffect, useState } from 'react';
import { Product } from '@/lib/types';
import SiteHeader from './SiteHeader';

function formatPrice(price: string) {
  const numericPrice = Number(price);
  return price.trim() !== '' && Number.isFinite(numericPrice) ? `€${numericPrice.toFixed(2)}` : price;
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch('/api/products', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Kon producten niet laden.');
        setProducts(data.products ?? []);
      } catch {
        setProducts([]);
      }
    }

    loadProducts();
  }, []);

  return (
    <main className="container">
      <SiteHeader />

      <section className="hero home-hero">
        <span className="badge">Premium print & design</span>
        <h1>Lakenvelder Design</h1>
        <p>Unieke en stijlvolle stickers, printwerk en visuele producten voor jouw merk. Van opvallende voertuigbestickering tot bedrukte T-shirts, mokken, stickers en reclameborden — altijd met topkwaliteit en scherpe prijzen.</p>
      </section>

      <section id="prijzen" className="table-card">
        <h2>Publieke prijslijst</h2>
        <p>Alle productprijzen zijn direct zichtbaar voor klanten.</p>
        <div className="grid grid-3">
          {products.map((product) => (
            <article key={product.id} className="card">
              {product.imageUrl ? <div style={{ marginBottom: '0.75rem', overflow: 'hidden', borderRadius: 18, background: '#f3f4f6' }}>
                <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: 260, objectFit: 'contain', display: 'block' }} />
              </div> : null}
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <strong>{formatPrice(product.price)}</strong>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
