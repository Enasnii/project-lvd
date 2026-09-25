import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteHeader from '../../SiteHeader';
import ProductGallery from '../../ProductGallery';
import ProductOptions from '../../ProductOptions';
import { getProductBySlug } from '@/lib/products-store';
import { isAdminAuthenticated } from '@/lib/auth';

type Props = { params: { slug: string } };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params, searchParams }: Props & { searchParams?: { preview?: string } }): Promise<Metadata> {
  const canPreview = searchParams?.preview === '1' && await isAdminAuthenticated();
  const product = await getProductBySlug(params.slug, canPreview);
  return product ? { title: `${product.name} - Lakenvelder Design`, description: product.description.slice(0, 160) } : {};
}

function formatPrice(price: string) { const numericPrice = Number(price); return Number.isFinite(numericPrice) ? `€${numericPrice.toFixed(2)}` : price; }

export default async function ProductPage({ params, searchParams }: Props & { searchParams?: { preview?: string } }) {
  const canPreview = searchParams?.preview === '1' && await isAdminAuthenticated();
  const product = await getProductBySlug(params.slug, canPreview);
  if (!product) notFound();
  return <main className="container page-shell product-page"><SiteHeader />{canPreview ? <div className="product-preview-notice">Voorbeeldweergave voor beheerders · Verborgen</div> : null}<Link className="back-link" href="/#prijzen">&larr; Terug naar producten</Link><article className="product-detail"><ProductGallery product={product} /><div className="product-detail-info">{product.category ? <span className="product-category">{product.category}</span> : null}<h1>{product.name}</h1><p className="product-price">{formatPrice(product.price)}</p><p className="product-description">{product.description}</p><ProductOptions product={product} /><Link className="btn btn-primary product-cta" href={`/product-aanvragen?product=${encodeURIComponent(product.name)}`}>Offerte aanvragen <span aria-hidden="true">&rarr;</span></Link></div></article></main>;
}