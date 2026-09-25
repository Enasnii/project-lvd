import { promises as fs } from 'fs';
import path from 'path';
import { Product, ProductColor, ProductImage, ProductInput, ProductStatus, ProductVariant } from './types';
import { deleteUploadedFile, readJsonFile, writeJsonFile } from './local-storage';
import { initDatabase, runSql } from './db';

const initialProducts: Product[] = [];
const fallbackStoragePath = process.env.PRODUCTS_STORAGE_FILE ?? path.join(process.env.APP_STORAGE_DIR || '/app/storage', 'products', 'products.json');
type ProductRow = Partial<Product> & { image_url?: string; main_image_url?: string; created_at?: string; updated_at?: string };

function slugify(value: string) { return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'product'; }
function parseJson<T>(value: unknown, fallback: T): T { if (Array.isArray(value)) return value as T; if (typeof value === 'string') { try { return JSON.parse(value) as T; } catch { return fallback; } } return fallback; }
function normalizeStatus(value: unknown): ProductStatus { return value === 'hidden' || value === 'draft' ? 'hidden' : 'published'; }

function normalizeProduct(row: ProductRow): Product {
  const imageUrl = row.imageUrl ?? row.image_url ?? '';
  const storedImages = parseJson<ProductImage[]>(row.images, []);
  const images = (storedImages.length ? storedImages : imageUrl ? [{ id: `${row.id}-main`, url: imageUrl, order: 0 }] : []).sort((a, b) => a.order - b.order);
  const mainImageUrl = row.mainImageUrl ?? row.main_image_url ?? images[0]?.url ?? imageUrl;
  const createdAt = row.createdAt ?? row.created_at ?? new Date().toISOString();
  return { id: row.id ?? crypto.randomUUID(), name: row.name ?? '', slug: row.slug ?? slugify(row.name ?? ''), description: row.description ?? '', price: row.price ?? '', imageUrl: mainImageUrl, mainImageUrl, category: row.category ?? '', images, colors: parseJson<ProductColor[]>(row.colors, []), variants: parseJson<ProductVariant[]>(row.variants, []), status: normalizeStatus(row.status), createdAt, updatedAt: row.updatedAt ?? row.updated_at ?? createdAt };
}

async function ensureFallbackStorageFile() { await fs.mkdir(path.dirname(fallbackStoragePath), { recursive: true }); }
async function readFallbackProducts(): Promise<Product[]> { try { const parsed = await readJsonFile('products/products.json', initialProducts); return Array.isArray(parsed) ? parsed.map(normalizeProduct) : initialProducts; } catch { return initialProducts; } }
async function writeFallbackProducts(products: Product[]) { await ensureFallbackStorageFile(); await writeJsonFile('products/products.json', products); await fs.writeFile(fallbackStoragePath, JSON.stringify(products, null, 2), 'utf8'); }

async function uniqueSlug(name: string, currentId?: string, fallbackProducts?: Product[]) {
  const base = slugify(name);
  if (fallbackProducts) { const used = fallbackProducts.filter((product) => product.id !== currentId).map((product) => product.slug); let slug = base; let suffix = 2; while (used.includes(slug)) slug = `${base}-${suffix++}`; return slug; }
  let slug = base; let suffix = 2;
  while ((await runSql<{ id: string }>('SELECT id FROM products WHERE slug = $1 AND id <> $2 LIMIT 1;', [slug, currentId ?? ''])).rows.length) slug = `${base}-${suffix++}`;
  return slug;
}

function dbProductColumns() { return `id, name, slug, description, price, image_url AS "imageUrl", main_image_url AS "mainImageUrl", category, images, colors, variants, status, created_at AS "createdAt", updated_at AS "updatedAt"`; }
async function backfillLegacySlugs() {
  const rows = await runSql<{ id: string; name: string; slug: string | null }>('SELECT id, name, slug FROM products WHERE slug IS NULL OR slug = \'\' ORDER BY created_at ASC, id ASC;');
  const used = new Set<string>();
  for (const row of rows.rows) { let slug = slugify(row.name); let suffix = 2; while (used.has(slug) || (await runSql('SELECT 1 FROM products WHERE slug = $1 LIMIT 1;', [slug])).rows.length) slug = `${slugify(row.name)}-${suffix++}`; used.add(slug); await runSql('UPDATE products SET slug = $1, updated_at = updated_at WHERE id = $2;', [slug, row.id]); }
}

function buildProduct(input: ProductInput, id: string, createdAt: string, updatedAt: string, slug: string): Product {
  const legacyImageUrl = input.imageUrl?.trim() ?? '';
  const images = (input.images?.length ? input.images : legacyImageUrl ? [{ id: crypto.randomUUID(), url: legacyImageUrl, order: 0 }] : []).map((image, index) => ({ ...image, order: index }));
  const mainImageUrl = input.mainImageUrl || images[0]?.url || legacyImageUrl;
  return { id, name: input.name.trim(), slug, description: input.description.trim(), price: input.price.trim(), imageUrl: mainImageUrl, mainImageUrl, category: input.category?.trim() ?? '', images, colors: input.colors ?? [], variants: input.variants ?? [], status: normalizeStatus(input.status), createdAt, updatedAt };
}

async function storedProductImageUrls(excludeId?: string) {
  const rows = await runSql<{ id: string; image_url: string; images: unknown }>('SELECT id, image_url, images FROM products;');
  const urls = new Set<string>();
  for (const row of rows.rows) { if (row.id === excludeId) continue; if (row.image_url) urls.add(row.image_url); for (const image of parseJson<ProductImage[]>(row.images, [])) urls.add(image.url); }
  return urls;
}
async function cleanupOwnedProductImages(urls: string[], excludeId?: string) {
  const otherUrls = await storedProductImageUrls(excludeId);
  for (const url of urls.filter((value, index, values) => values.indexOf(value) === index)) if (url.startsWith('/uploads/products/') && !otherUrls.has(url)) await deleteUploadedFile(url);
}

export async function getProducts(includeUnpublished = false): Promise<Product[]> {
  try { await initDatabase(); await backfillLegacySlugs(); const result = await runSql(`SELECT ${dbProductColumns()} FROM products ORDER BY created_at DESC, id DESC;`); const products = result.rows.map(normalizeProduct); return includeUnpublished ? products : products.filter((product) => product.status === 'published'); }
  catch (error) { console.warn('Falling back to file-based product storage.', error); const products = await readFallbackProducts(); return includeUnpublished ? products : products.filter((product) => product.status === 'published'); }
}
export async function getProductBySlug(slug: string, includeUnpublished = false): Promise<Product | null> { const products = await getProducts(includeUnpublished); return products.find((product) => product.slug === slug) ?? null; }

export async function createProduct(input: ProductInput): Promise<Product> {
  try { await initDatabase(); const slug = await uniqueSlug(input.slug?.trim() || input.name); const now = new Date().toISOString(); const product = buildProduct(input, crypto.randomUUID(), now, now, slug); await runSql(`INSERT INTO products (id, name, slug, description, price, image_url, main_image_url, category, images, colors, variants, status, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11::jsonb,$12,$13,$14);`, [product.id, product.name, product.slug, product.description, product.price, product.imageUrl, product.mainImageUrl, product.category, JSON.stringify(product.images), JSON.stringify(product.colors), JSON.stringify(product.variants), product.status, product.createdAt, product.updatedAt]); return product; }
  catch (error) { if (process.env.POSTGRES_URL) throw error; console.warn('Product save failed, using fallback storage.', error); const products = await readFallbackProducts(); const now = new Date().toISOString(); const product = buildProduct(input, crypto.randomUUID(), now, now, await uniqueSlug(input.slug?.trim() || input.name, undefined, products)); await writeFallbackProducts([product, ...products]); return product; }
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  try { await initDatabase(); const existingRow = (await runSql(`SELECT ${dbProductColumns()} FROM products WHERE id = $1;`, [id])).rows[0]; if (!existingRow) throw new Error('Product niet gevonden.'); const existing = normalizeProduct(existingRow); const now = new Date().toISOString(); const product = buildProduct(input, id, existing.createdAt, now, await uniqueSlug(input.slug?.trim() || input.name, id)); await runSql(`UPDATE products SET name=$1, slug=$2, description=$3, price=$4, image_url=$5, main_image_url=$6, category=$7, images=$8::jsonb, colors=$9::jsonb, variants=$10::jsonb, status=$11, updated_at=$12 WHERE id=$13;`, [product.name, product.slug, product.description, product.price, product.imageUrl, product.mainImageUrl, product.category, JSON.stringify(product.images), JSON.stringify(product.colors), JSON.stringify(product.variants), product.status, product.updatedAt, id]); await cleanupOwnedProductImages(existing.images.map((image) => image.url).filter((url) => !product.images.some((image) => image.url === url)), id); return product; }
  catch (error) { if (process.env.POSTGRES_URL || (error instanceof Error && error.message === 'Product niet gevonden.')) throw error; console.warn('Product update failed, using fallback storage.', error); const products = await readFallbackProducts(); const index = products.findIndex((product) => product.id === id); if (index === -1) throw new Error('Product niet gevonden.'); const existing = products[index]; const now = new Date().toISOString(); const product = buildProduct(input, id, existing.createdAt, now, await uniqueSlug(input.slug?.trim() || input.name, id, products)); products[index] = product; await writeFallbackProducts(products); return product; }
}

export async function deleteProduct(id: string): Promise<void> {
  try { await initDatabase(); const existingRow = (await runSql(`SELECT ${dbProductColumns()} FROM products WHERE id = $1;`, [id])).rows[0]; if (!existingRow) throw new Error('Product niet gevonden.'); const existing = normalizeProduct(existingRow); await runSql('DELETE FROM products WHERE id = $1;', [id]); await cleanupOwnedProductImages(existing.images.map((image) => image.url), id); }
  catch (error) { if (process.env.POSTGRES_URL || (error instanceof Error && error.message === 'Product niet gevonden.')) throw error; const products = await readFallbackProducts(); const existing = products.find((product) => product.id === id); if (!existing) throw new Error('Product niet gevonden.'); await writeFallbackProducts(products.filter((product) => product.id !== id)); const otherUrls = new Set(products.filter((product) => product.id !== id).flatMap((product) => product.images.map((image) => image.url))); for (const url of existing.images.map((image) => image.url)) if (url.startsWith('/uploads/products/') && !otherUrls.has(url)) await deleteUploadedFile(url); }
}
