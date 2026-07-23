import { sql } from '@vercel/postgres';
import { Product, ProductInput } from './types';

const initialProducts: Product[] = [
  {
    id: 'sample-1',
    name: 'Premium Vinyl Sticker',
    description: 'Duurzame vinyl sticker voor verpakking en promoties.',
    price: 14.95,
    imageUrl: 'https://images.unsplash.com/photo-1582053433976-25c00369fc93?auto=format&fit=crop&w=800&q=80',
    createdAt: new Date().toISOString()
  },
  {
    id: 'sample-2',
    name: 'Matte Label Set',
    description: 'Set van 10 matte labels voor producten en verpakkingen.',
    price: 24.5,
    imageUrl: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80',
    createdAt: new Date().toISOString()
  },
  {
    id: 'sample-3',
    name: 'Event Promo Sticker',
    description: 'Opvallende sticker voor beurs-, festival- en launch-events.',
    price: 9.95,
    imageUrl: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=800&q=80',
    createdAt: new Date().toISOString()
  }
];

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
  await ensureProductsTable();
  await seedInitialProducts();

  const result = await sql`
    SELECT id, name, description, price, image_url AS "imageUrl", created_at AS "createdAt"
    FROM products
    ORDER BY created_at DESC, id DESC
  `;

  return result.rows as Product[];
}

export async function createProduct(input: ProductInput): Promise<Product> {
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
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
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
}

export async function deleteProduct(id: string): Promise<void> {
  await ensureProductsTable();
  await sql`DELETE FROM products WHERE id = ${id};`;
}
