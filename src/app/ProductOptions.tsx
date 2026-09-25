'use client';

import { useState } from 'react';
import { Product } from '@/lib/types';

export default function ProductOptions({ product }: { product: Product }) {
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.id ?? '');
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]?.id ?? '');
  return <>
    {product.colors.length ? <section className="product-option"><h2>Kleur</h2><div className="product-colors">{product.colors.map((color) => <button className={selectedColor === color.id ? 'product-color selected' : 'product-color'} type="button" key={color.id} onClick={() => setSelectedColor(color.id)}><i style={{ backgroundColor: color.hex || '#d1d5db' }} />{color.name}</button>)}</div></section> : null}
    {product.variants.length ? <section className="product-option"><h2>Maat / variant</h2><div className="product-variants">{product.variants.map((variant) => <button className={selectedVariant === variant.id ? 'selected' : ''} type="button" key={variant.id} onClick={() => setSelectedVariant(variant.id)}>{variant.name}</button>)}</div></section> : null}
  </>;
}