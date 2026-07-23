"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Product } from '@/lib/types';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const stored = window.localStorage.getItem('stickerbedrijf-products');
    if (stored) {
      try {
        setProducts(JSON.parse(stored));
      } catch {
        setProducts([]);
      }
    }
  }, []);

  return (
    <main className="container">
      <nav>
    
        <div className="nav-links">
          <Link href="#prijzen">Prijslijst</Link>
          <Link className="btn btn-secondary" href="/admin/login">Admin login</Link>
        </div>
      </nav>

      <section className="hero">
        <span className="badge">Premium print & design</span>
        <h1>Lakenvelder Design</h1>
        <p>Unieke en stijlvolle stickers, printwerk en visuele producten voor jouw merk. Van opvallende voertuigbestickering tot bedrukte T-shirts, mokken, stickers en reclameborden — altijd met topkwaliteit en scherpe prijzen.</p>
        <div className="nav-links">
          <a className="btn btn-primary" href="#prijzen">Bekijk prijzen</a>
        </div>
      </section>

      <section id="prijzen" className="table-card">
        <h2>Publieke prijslijst</h2>
        <p>Alle productprijzen zijn direct zichtbaar voor klanten.</p>
        <div className="grid grid-3">
          {products.map((product) => (
            <article key={product.id} className="card">
              <div style={{ marginBottom: '0.75rem', overflow: 'hidden', borderRadius: 18, background: '#f3f4f6' }}>
                <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: 260, objectFit: 'contain', display: 'block' }} />
              </div>
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <strong>€{product.price.toFixed(2)}</strong>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
