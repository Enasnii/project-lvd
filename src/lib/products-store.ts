import { promises as fs } from 'fs';
import path from 'path';
import { sql } from '@vercel/postgres';
import { Product, ProductInput } from './types';

const initialProducts: Product[] = [];
const fallbackStoragePath = process.env.PRODUCTS_STORAGE_FILE ?? path.join('/tmp', 'products.json');
const blobStoragePath = 'data/products.json';

async function ensureFallbackStorageFile() {
  await fs.mkdir(path.dirname(fallbackStoragePath), { recursive: true });
}

async function readFallbackProducts(): Promise<Product[]> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { list } = await import('@vercel/blob');
      const result = await list({ prefix: blobStoragePath, limit: 1 });
      const blob = result.blobs.find((item) => item.pathname === blobStoragePath);

      if (!blob) return initialProducts;

      const response = await fetch(blob.url, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Blob metadata request failed with ${response.status}`);

      const parsed = await response.json();
      return Array.isArray(parsed) ? parsed : initialProducts;
    } catch (error) {
      console.warn('Blob product storage read failed.', error);
      throw error;
    }
  }

  try {
    await ensureFallbackStorageFile();
    const file = await fs.readFile(fallbackStoragePath, 'utf8');
    const parsed = JSON.parse(file);
    return Array.isArray(parsed) ? parsed : initialProducts;
  } catch {
    return initialProducts;
  }
}

async function writeFallbackProducts(products: Product[]) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob');
    await put(blobStoragePath, JSON.stringify(products, null, 2), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json'
    });
    return;
  }

  await ensureFallbackStorageFile();
  await fs.writeFile(fallbackStoragePath, JSON.stringify(products, null, 2), 'utf8');
}

async function ensureProductsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price DOUBLE PRECISION NOT NULL,
      image_url TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
}

async function seedInitialProducts() {
  const result = await sql`SELECT COUNT(*)::int AS count FROM products;`;
  const count = Number(result.rows[0]?.count ?? 0);

  if (count > 0) return;

  for (const product of initialProducts) {
    await sql`
      INSERT INTO products (id, name, description, price, image_url, created_at)
      VALUES (${product.id}, ${product.name}, ${product.description}, ${product.price}, ${product.imageUrl}, ${product.createdAt});
    `;
  }
}

export async function getProducts(): Promise<Product[]> {
  try {
    await ensureProductsTable();
    await seedInitialProducts();

    const result = await sql`
      SELECT id, name, description, price, image_url AS "imageUrl", created_at AS "createdAt"
      FROM products
      ORDER BY created_at DESC, id DESC
    `;

    return result.rows as Product[];
  } catch (error) {
    console.warn('Falling back to file-based product storage.', error);
    return readFallbackProducts();
  }
}

export async function createProduct(input: ProductInput): Promise<Product> {
  try {
    await ensureProductsTable();

    const product: Product = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      description: input.description.trim(),
      price: Number(input.price),
      imageUrl: input.imageUrl.trim(),
      createdAt: new Date().toISOString()
    };

    await sql`
      INSERT INTO products (id, name, description, price, image_url, created_at)
      VALUES (${product.id}, ${product.name}, ${product.description}, ${product.price}, ${product.imageUrl}, ${product.createdAt});
    `;

    return product;
  } catch (error) {
    console.warn('Product save failed, using fallback storage.', error);
    const products = await readFallbackProducts();
    const product: Product = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      description: input.description.trim(),
      price: Number(input.price),
      imageUrl: input.imageUrl.trim(),
      createdAt: new Date().toISOString()
    };
    await writeFallbackProducts([product, ...products]);
    return product;
  }
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  try {
    await ensureProductsTable();

    const updated: Product = {
      id,
      name: input.name.trim(),
      description: input.description.trim(),
      price: Number(input.price),
      imageUrl: input.imageUrl.trim(),
      createdAt: new Date().toISOString()
    };

    await sql`
      UPDATE products
      SET name = ${updated.name}, description = ${updated.description}, price = ${updated.price}, image_url = ${updated.imageUrl}
      WHERE id = ${id};
    `;

    return updated;
  } catch (error) {
    console.warn('Product update failed, using fallback storage.', error);
    const products = await readFallbackProducts();
    const index = products.findIndex((product) => product.id === id);
    if (index === -1) {
      throw new Error('Product niet gevonden.');
    }

    const updatedProduct = {
      ...products[index],
      name: input.name.trim(),
      description: input.description.trim(),
      price: Number(input.price),
      imageUrl: input.imageUrl.trim()
    };

    products[index] = updatedProduct;
    await writeFallbackProducts(products);
    return updatedProduct;
  }
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    await ensureProductsTable();
    await sql`DELETE FROM products WHERE id = ${id};`;
  } catch (error) {
    console.warn('Product delete failed, using fallback storage.', error);
    const products = await readFallbackProducts();
    const filtered = products.filter((product) => product.id !== id);
    if (filtered.length === products.length) {
      throw new Error('Product niet gevonden.');
    }
    await writeFallbackProducts(filtered);
  }
}
