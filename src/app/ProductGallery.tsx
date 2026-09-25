'use client';

import { useState } from 'react';
import { Product } from '@/lib/types';

export default function ProductGallery({ product }: { product: Product }) {
  const images = product.images.length ? product.images : product.imageUrl ? [{ id: 'legacy-main', url: product.imageUrl, order: 0 }] : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const activeImage = images[activeIndex];
  function move(step: number) { if (!images.length) return; setActiveIndex((current) => (current + step + images.length) % images.length); }
  return <div className="product-gallery"><div className="product-gallery-main" onTouchEnd={(event) => { const start = Number(event.currentTarget.dataset.touchStart || 0); const delta = event.changedTouches[0].clientX - start; if (Math.abs(delta) > 45) move(delta < 0 ? 1 : -1); }} onTouchStart={(event) => { event.currentTarget.dataset.touchStart = String(event.touches[0].clientX); }}><button className="gallery-arrow gallery-arrow-left" type="button" onClick={() => move(-1)} aria-label="Vorige foto">&larr;</button>{activeImage ? <button className="gallery-image-button" type="button" onClick={() => setIsLightboxOpen(true)} aria-label="Foto vergroten"><img src={activeImage.url} alt={activeImage.alt || product.name} /></button> : <div className="gallery-placeholder">Nog geen productfoto</div>}<button className="gallery-arrow gallery-arrow-right" type="button" onClick={() => move(1)} aria-label="Volgende foto">&rarr;</button></div>{images.length > 1 ? <div className="product-thumbnails">{images.map((image, index) => <button className={index === activeIndex ? 'product-thumbnail active' : 'product-thumbnail'} type="button" key={image.id} onClick={() => setActiveIndex(index)}><img src={image.url} alt={`${product.name} foto ${index + 1}`} /></button>)}</div> : null}{isLightboxOpen && activeImage ? <div className="product-lightbox" role="dialog" aria-modal="true" onClick={() => setIsLightboxOpen(false)}><img src={activeImage.url} alt={activeImage.alt || product.name} /></div> : null}</div>;
}