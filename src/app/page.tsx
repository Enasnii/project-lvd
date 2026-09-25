"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Product } from '@/lib/types';
import SiteHeader from './SiteHeader';

function formatPrice(price: string | number | null | undefined) {
  const textPrice = String(price ?? '').trim();
  const numericPrice = Number(textPrice);
  return textPrice !== '' && Number.isFinite(numericPrice) ? `€${numericPrice.toFixed(2)}` : textPrice;
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
            <Link href={`/producten/${product.slug}`} key={product.id} className="card product-card">
              {product.imageUrl ? <div style={{ marginBottom: '0.75rem', overflow: 'hidden', borderRadius: 18, background: '#f3f4f6' }}>
                <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: 260, objectFit: 'contain', display: 'block' }} />
              </div> : null}
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              {product.colors.length ? <div className="product-card-colors" aria-label={`Beschikbare kleuren: ${product.colors.map((color) => color.name).join(', ')}`}>
                {product.colors.slice(0, 5).map((color) => <i key={color.id} title={color.name} style={{ backgroundColor: color.hex || '#d1d5db' }} />)}
                {product.colors.length > 5 ? <span>+{product.colors.length - 5}</span> : null}
              </div> : null}
              <strong>{formatPrice(product.price)}</strong>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
