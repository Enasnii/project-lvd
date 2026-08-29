import { promises as fs } from 'fs';
import path from 'path';
import { Product, ProductInput } from './types';
import { readJsonFile, writeJsonFile } from './local-storage';
import { initDatabase, runSql } from './db';

const initialProducts: Product[] = [];
const fallbackStoragePath = process.env.PRODUCTS_STORAGE_FILE ?? path.join(process.env.APP_STORAGE_DIR || '/app/storage', 'products', 'products.json');

async function ensureFallbackStorageFile() {
  await fs.mkdir(path.dirname(fallbackStoragePath), { recursive: true });
}

async function readFallbackProducts(): Promise<Product[]> {
  try {
    const parsed = await readJsonFile('products/products.json', initialProducts);
    return Array.isArray(parsed) ? parsed : initialProducts;
  } catch {
    return initialProducts;
  }
}

async function writeFallbackProducts(products: Product[]) {
  await ensureFallbackStorageFile();
  await writeJsonFile('products/products.json', products);
  await fs.writeFile(fallbackStoragePath, JSON.stringify(products, null, 2), 'utf8');
}

async function ensureProductsTable() {
  await initDatabase();
}

async function seedInitialProducts() {
  const result = await runSql<{ count: string }>('SELECT COUNT(*)::int AS count FROM products;');
  const count = Number(result.rows[0]?.count ?? 0);

  if (count > 0) return;

  for (const product of initialProducts) {
    await runSql(
      `INSERT INTO products (id, name, description, price, image_url, created_at) VALUES ($1, $2, $3, $4, $5, $6);`,
      [product.id, product.name, product.description, product.price, product.imageUrl, product.createdAt]
    );
  }
}

export async function getProducts(): Promise<Product[]> {
  try {
    await ensureProductsTable();
    await seedInitialProducts();

    const result = await runSql<Product>(`SELECT id, name, description, price, image_url AS "imageUrl", created_at AS "createdAt" FROM products ORDER BY created_at DESC, id DESC;`);
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
      price: input.price.trim(),
      imageUrl: input.imageUrl.trim(),
      createdAt: new Date().toISOString()
    };

    await runSql(
      `INSERT INTO products (id, name, description, price, image_url, created_at) VALUES ($1, $2, $3, $4, $5, $6);`,
      [product.id, product.name, product.description, product.price, product.imageUrl, product.createdAt]
    );

    return product;
  } catch (error) {
    console.warn('Product save failed, using fallback storage.', error);
    const products = await readFallbackProducts();
    const product: Product = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      description: input.description.trim(),
      price: input.price.trim(),
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
      price: input.price.trim(),
      imageUrl: input.imageUrl.trim(),
      createdAt: new Date().toISOString()
    };

    await runSql(
      `UPDATE products SET name = $1, description = $2, price = $3, image_url = $4 WHERE id = $5;`,
      [updated.name, updated.description, updated.price, updated.imageUrl, id]
    );

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
      price: input.price.trim(),
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
    const result = await runSql('DELETE FROM products WHERE id = $1;', [id]);

    if ((result.rowCount ?? 0) === 0) {
      const products = await readFallbackProducts();
      const filtered = products.filter((product) => product.id !== id);
      if (filtered.length === products.length) {
        throw new Error('Product niet gevonden.');
      }
      await writeFallbackProducts(filtered);
      return;
    }

    try {
      const products = await readFallbackProducts();
      const filtered = products.filter((product) => product.id !== id);
      if (filtered.length !== products.length) {
        await writeFallbackProducts(filtered);
      }
    } catch (fallbackError) {
      console.warn('Fallback product cleanup failed after database delete.', fallbackError);
    }
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
